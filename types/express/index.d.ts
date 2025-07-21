// types/express/index.d.ts
import { IUser } from "../../src/models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Optional if your middleware sometimes doesn't set it
    }
  }
}
