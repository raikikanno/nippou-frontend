require("@testing-library/jest-dom");

// テスト環境用の環境変数を設定
process.env.NEXT_PUBLIC_API_URL = "http://localhost";

// fetchのモックを設定
global.fetch = jest.fn();

// テスト後にfetchのモックをクリア
afterEach(() => {
  jest.clearAllMocks();
});
