/**
 * ShopSphere Full System & API Test Suite
 * Executes end-to-end verification across all backend routes, security policies, and DB states.
 */

const BASE_URL = "http://localhost:5440"

interface TestResult {
  suite: string
  name: string
  passed: boolean
  durationMs: number
  details?: string
  error?: string
}

const results: TestResult[] = []

async function runTest(
  suite: string,
  name: string,
  fn: () => Promise<void>
) {
  const start = Date.now()
  try {
    await fn()
    const durationMs = Date.now() - start
    results.push({ suite, name, passed: true, durationMs })
    console.log(`  ✅ [PASS] ${name} (${durationMs}ms)`)
  } catch (err: any) {
    const durationMs = Date.now() - start
    results.push({
      suite,
      name,
      passed: false,
      durationMs,
      error: err.message || String(err),
    })
    console.error(`  ❌ [FAIL] ${name} (${durationMs}ms):`, err.message)
  }
}

async function request(
  endpoint: string,
  options: {
    method?: string
    token?: string
    body?: any
    headers?: Record<string, string>
  } = {}
) {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  }

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const text = await res.text()
  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  return { status: res.status, ok: res.ok, data, headers: res.headers }
}

async function runTestSuite() {
  console.log("\n=======================================================")
  console.log("🚀 Starting ShopSphere Full System End-to-End API Test Suite")
  console.log(`🌐 Target Base URL: ${BASE_URL}`)
  console.log("=======================================================\n")

  let adminToken = ""
  let deliveryToken = ""
  let userToken = ""
  let sampleProductId = ""
  let sampleOrderId = ""
  let sampleAWB = ""

  // -----------------------------------------------------------------
  // 1. HEALTH & TELEMETRY SUITE
  // -----------------------------------------------------------------
  console.log("\n🩺 [1/8] Testing Health & System Telemetry...")

  await runTest("Health", "GET /health responds with 200 OK & DB Connected", async () => {
    const res = await request("/health")
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`)
    if (res.data.status !== "healthy") throw new Error(`Expected status "healthy", got ${res.data.status}`)
    if (res.data.database.status !== "connected") throw new Error(`DB status: ${res.data.database.status}`)
  })

  await runTest("Health", "GET /api/health returns valid system metadata", async () => {
    const res = await request("/api/health")
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`)
    if (!res.data.uptimeSeconds && res.data.uptimeSeconds !== 0) throw new Error("Missing uptimeSeconds")
  })

  // -----------------------------------------------------------------
  // 2. AUTHENTICATION & ACCESS CONTROL SUITE
  // -----------------------------------------------------------------
  console.log("\n🔐 [2/8] Testing Authentication & Role Tokens...")

  await runTest("Auth", "Admin 1-Click Login (admin@shopshere.com)", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: { email: "admin@shopshere.com", password: "Admin@12345" },
    })
    if (res.status !== 200) throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.data)}`)
    if (!res.data.token && !res.data.accessToken) throw new Error("No token returned")
    adminToken = res.data.token || res.data.accessToken
    if (res.data.user?.role !== "admin") throw new Error(`Expected role "admin", got ${res.data.user?.role}`)
  })

  await runTest("Auth", "Delivery Partner Login (delivery@shopshere.com)", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: { email: "delivery@shopshere.com", password: "Delivery@12345" },
    })
    if (res.status !== 200) throw new Error(`Login failed with status ${res.status}`)
    deliveryToken = res.data.token || res.data.accessToken
    if (res.data.user?.role !== "delivery") throw new Error(`Expected role "delivery", got ${res.data.user?.role}`)
  })

  await runTest("Auth", "Customer Login (user@shopshere.com)", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: { email: "user@shopshere.com", password: "User@12345" },
    })
    if (res.status !== 200) throw new Error(`Login failed with status ${res.status}`)
    userToken = res.data.token || res.data.accessToken
    if (res.data.user?.role !== "user") throw new Error(`Expected role "user", got ${res.data.user?.role}`)
  })

  await runTest("Auth", "GET /api/auth/me returns authenticated user identity", async () => {
    const res = await request("/api/auth/me", { token: userToken })
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`)
    if (res.data.user?.email !== "user@shopshere.com") throw new Error(`Wrong user email: ${res.data.user?.email}`)
  })

  await runTest("Auth", "Rejects invalid credentials with 400/401", async () => {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: { email: "user@shopshere.com", password: "WrongPassword!999" },
    })
    if (res.status !== 400 && res.status !== 401) throw new Error(`Expected 400/401, got ${res.status}`)
  })

  // -----------------------------------------------------------------
  // 3. PRODUCT CATALOG SUITE
  // -----------------------------------------------------------------
  console.log("\n🛍️ [3/8] Testing Product Catalog & Search...")

  await runTest("Products", "GET /api/products returns paginated product array", async () => {
    const res = await request("/api/products?page=1&limit=8")
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`)
    const items = res.data.products || res.data
    if (!Array.isArray(items) || items.length === 0) throw new Error("No products found")
    sampleProductId = items[0]._id
  })

  await runTest("Products", "GET /api/products/categories returns categories list", async () => {
    const res = await request("/api/products/categories")
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`)
    const categories = res.data.categories || res.data
    if (!Array.isArray(categories) || categories.length === 0) throw new Error("No categories found")
  })

  await runTest("Products", "GET /api/products/:id returns full single product details", async () => {
    if (!sampleProductId) throw new Error("No sampleProductId available")
    const res = await request(`/api/products/${sampleProductId}`)
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`)
    const prod = res.data.product || res.data
    if (!prod.name || !prod.price) throw new Error("Missing required product fields (name/price)")
  })

  // -----------------------------------------------------------------
  // 4. COUPONS & DISCOUNTS SUITE
  // -----------------------------------------------------------------
  console.log("\n🎟️ [4/8] Testing Promo Coupons & Discount Engine...")

  await runTest("Coupons", "GET /api/coupons returns available public coupons", async () => {
    const res = await request("/api/coupons")
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`)
    if (!Array.isArray(res.data.coupons)) throw new Error("Coupons is not an array")
  })

  await runTest("Coupons", "POST /api/coupons/validate calculates correct discount for SHOPSHERE10", async () => {
    const res = await request("/api/coupons/validate", {
      method: "POST",
      body: { code: "SHOPSHERE10", cartTotal: 1500 },
    })
    if (res.status !== 200) throw new Error(`Validation failed: ${JSON.stringify(res.data)}`)
    const discount = res.data.discountAmount || res.data.discount
    if (!discount || discount <= 0) throw new Error(`Expected discount > 0, got ${discount}`)
    if (res.data.finalAmount !== 1500 - discount) {
      throw new Error(`Calculated finalAmount mismatch: ${res.data.finalAmount}`)
    }
  })

  await runTest("Coupons", "Rejects invalid coupon code with 400", async () => {
    const res = await request("/api/coupons/validate", {
      method: "POST",
      body: { code: "INVALIDCODE999", cartTotal: 1000 },
    })
    if (res.status !== 400 && res.status !== 404) throw new Error(`Expected 400/404, got ${res.status}`)
  })

  // -----------------------------------------------------------------
  // 5. CART OPERATIONS SUITE
  // -----------------------------------------------------------------
  console.log("\n🛒 [5/8] Testing Cart Operations...")

  await runTest("Cart", "POST /api/cart adds item to customer cart", async () => {
    if (!sampleProductId) throw new Error("No sampleProductId available")
    const res = await request("/api/cart", {
      method: "POST",
      token: userToken,
      body: { productId: sampleProductId, quantity: 2 },
    })
    if (res.status !== 200 && res.status !== 201) throw new Error(`Add to cart failed with status ${res.status}`)
  })

  await runTest("Cart", "GET /api/cart retrieves user cart contents", async () => {
    const res = await request("/api/cart", { token: userToken })
    if (res.status !== 200) throw new Error(`Get cart failed with status ${res.status}`)
    const cart = res.data.cart || res.data
    if (!cart.items || cart.items.length === 0) throw new Error("Cart items array empty")
  })

  // -----------------------------------------------------------------
  // 6. ORDER LIFECYCLE & TRACKING SUITE
  // -----------------------------------------------------------------
  console.log("\n🧾 [6/8] Testing Order Placement & AWB Milestones...")

  await runTest("Orders", "POST /api/orders/demo creates instant verified order with AWB", async () => {
    if (!sampleProductId) throw new Error("No sampleProductId available")
    const res = await request("/api/orders/demo", {
      method: "POST",
      token: userToken,
      body: {
        items: [{ product: sampleProductId, quantity: 1, price: 999 }],
        shippingAddress: {
          fullName: "Rahul Kumar",
          phone: "9876543210",
          address: "Flat 402, Skyline Residency",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560001",
          country: "India",
        },
        paymentMethod: "COD",
        couponCode: "SHOPSHERE10",
        discountAmount: 100,
        totalAmount: 899,
      },
    })
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Order placement failed: ${JSON.stringify(res.data)}`)
    }
    const order = res.data.order || res.data
    sampleOrderId = order._id
    sampleAWB = order.trackingNumber
    if (!sampleAWB) throw new Error("Order created without trackingNumber AWB")
  })

  await runTest("Orders", "GET /api/orders/mine returns customer's placed orders", async () => {
    const res = await request("/api/orders/mine", { token: userToken })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const orders = res.data.orders || res.data
    if (!Array.isArray(orders) || orders.length === 0) throw new Error("Orders history is empty")
  })

  await runTest("Orders", "GET /api/orders/track/:identifier retrieves live tracking milestones", async () => {
    if (!sampleAWB) throw new Error("No sampleAWB available")
    const res = await request(`/api/orders/track/${sampleAWB}`)
    if (res.status !== 200) throw new Error(`Tracking lookup failed with status ${res.status}`)
    if (!res.data.order && !res.data.trackingNumber) throw new Error("Tracking details missing")
  })

  // -----------------------------------------------------------------
  // 7. DELIVERY LOGISTICS PORTAL SUITE
  // -----------------------------------------------------------------
  console.log("\n🚚 [7/8] Testing Delivery Partner Portal & Milestones...")

  await runTest("Delivery", "GET /api/delivery/orders loads active shipments with delivery token", async () => {
    const res = await request("/api/delivery/orders", { token: deliveryToken })
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.data)}`)
    if (!Array.isArray(res.data.orders)) throw new Error("Orders is not an array")
  })

  await runTest("Delivery", "PUT /api/delivery/orders/:id/status updates package to 'in_transit'", async () => {
    if (!sampleOrderId) throw new Error("No sampleOrderId available")
    const res = await request(`/api/delivery/orders/${sampleOrderId}/status`, {
      method: "PUT",
      token: deliveryToken,
      body: {
        status: "in_transit",
        note: "Departed Sort Facility",
        location: "Bengaluru Central Hub",
      },
    })
    if (res.status !== 200) throw new Error(`Delivery milestone update failed: ${JSON.stringify(res.data)}`)
  })

  await runTest("Delivery", "PUT /api/delivery/orders/:id/status marks package 'delivered' with signature", async () => {
    if (!sampleOrderId) throw new Error("No sampleOrderId available")
    const res = await request(`/api/delivery/orders/${sampleOrderId}/status`, {
      method: "PUT",
      token: deliveryToken,
      body: {
        status: "delivered",
        note: "Signed by Customer at Doorstep",
        location: "Bengaluru, Karnataka",
      },
    })
    if (res.status !== 200) throw new Error(`Mark delivered failed: ${JSON.stringify(res.data)}`)
    if (res.data.order?.orderStatus !== "delivered") {
      throw new Error(`Expected orderStatus "delivered", got ${res.data.order?.orderStatus}`)
    }
  })

  await runTest("Delivery", "Blocks customer (role: user) from delivery endpoints with 403", async () => {
    const res = await request("/api/delivery/orders", { token: userToken })
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got status ${res.status}`)
  })

  // -----------------------------------------------------------------
  // 8. ADMIN & AI ASSISTANT SUITE
  // -----------------------------------------------------------------
  console.log("\n👑 [8/8] Testing Admin Control & AI Chatbot...")

  await runTest("Admin", "GET /api/admin/users retrieves users list with Admin token", async () => {
    const res = await request("/api/admin/users", { token: adminToken })
    if (res.status !== 200) throw new Error(`Admin users fetch failed with status ${res.status}`)
    const users = res.data.users || res.data
    if (!Array.isArray(users) || users.length === 0) throw new Error("No users found")
  })

  await runTest("Admin", "Blocks non-admin customer from admin endpoints with 403", async () => {
    const res = await request("/api/admin/users", { token: userToken })
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got status ${res.status}`)
  })

  await runTest("Chat", "POST /api/chat processes AI assistant inquiry", async () => {
    const res = await request("/api/chat", {
      method: "POST",
      body: {
        message: "Hello! What products do you recommend for casual summer streetwear?",
      },
    })
    if (res.status !== 200) throw new Error(`Chat failed with status ${res.status}`)
    if (!res.data.reply && !res.data.message) throw new Error("No AI reply returned")
  })

  // -----------------------------------------------------------------
  // SUMMARY REPORT
  // -----------------------------------------------------------------
  console.log("\n=======================================================")
  console.log("📊 SYSTEM TEST SUITE EXECUTION SUMMARY")
  console.log("=======================================================")

  const total = results.length
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0)

  console.log(`Total Tests Executed: ${total}`)
  console.log(`✅ Passed:             ${passed}`)
  console.log(`❌ Failed:             ${failed}`)
  console.log(`⏱️ Total Duration:     ${totalDuration}ms`)
  console.log("=======================================================\n")

  if (failed > 0) {
    console.error("❌ FAILED TESTS SUMMARY:")
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.error(`  - [${r.suite}] ${r.name}: ${r.error}`)
      })
    process.exit(1)
  } else {
    console.log("🎉 ALL API SUBSYSTEMS & ROLE ACCESS CONTROLS PASSED 100%!")
    process.exit(0)
  }
}

runTestSuite().catch((err) => {
  console.error("❌ Fatal Test Runner Error:", err)
  process.exit(1)
})
