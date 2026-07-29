import "server-only";
import { MockOpenBankingAdapter } from "./mock-adapter";

export const openBanking = new MockOpenBankingAdapter();
