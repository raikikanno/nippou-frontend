import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "../page";
import { Provider as JotaiProvider, createStore } from "jotai";
import { authAtom } from "@/atoms/auth";

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
    
    // 環境変数をモック
    process.env.NEXT_PUBLIC_REGISTER_AUTH_ID = "raiki";
    process.env.NEXT_PUBLIC_REGISTER_AUTH_PASSWORD = "test";
  });

  const setup = (isAuthenticated = false) => {
    const store = createStore();
    store.set(authAtom, { isAuthenticated, isInitialized: true });

    render(
      <JotaiProvider store={store}>
        <RegisterPage />
      </JotaiProvider>
    );
  };

  describe("認証画面", () => {
    it("認証画面が表示される", () => {
      setup();
      expect(screen.getByText("登録ページへのアクセス認証")).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: /^ID$/ })).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/, { selector: 'input' })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "認証" })).toBeInTheDocument();
    });

    it("正しい認証情報で認証が成功する", async () => {
      setup();
      fireEvent.change(screen.getByRole("textbox", { name: /^ID$/ }), { target: { value: "raiki" } });
      fireEvent.change(screen.getByLabelText(/パスワード/, { selector: 'input' }), { target: { value: "test" } });
      fireEvent.click(screen.getByRole("button", { name: "認証" }));

      await waitFor(() => {
        expect(screen.getByText("ユーザー登録")).toBeInTheDocument();
      });
    });

    it("間違った認証情報でエラーメッセージが表示される", async () => {
      setup();
      fireEvent.change(screen.getByRole("textbox", { name: /^ID$/ }), { target: { value: "wrong" } });
      fireEvent.change(screen.getByLabelText(/パスワード/, { selector: 'input' }), { target: { value: "wrong" } });
      fireEvent.click(screen.getByRole("button", { name: "認証" }));

      await waitFor(() => {
        expect(screen.getByText("アクセス権限がありません")).toBeInTheDocument();
      });
    });
  });

  describe("登録フォーム", () => {
    beforeEach(() => {
      setup(true); // 認証済み状態でセットアップ
    });

    it("全項目入力し登録ボタンを押すとfetchが呼ばれ、メッセージが表示される", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("登録完了") });

      fireEvent.change(screen.getByRole("textbox", { name: /^名前$/ }), { target: { value: "テストユーザー" } });
      fireEvent.change(screen.getByRole("textbox", { name: /^チーム$/ }), { target: { value: "開発" } });
      fireEvent.change(screen.getByRole("textbox", { name: /^メールアドレス$/ }), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText(/パスワード/, { selector: 'input' }), { target: { value: "password123" } });

      fireEvent.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/auth\/register$/),
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "test@example.com",
              password: "password123",
              name: "テストユーザー",
              team: "開発",
            }),
          })
        );
        expect(screen.getByText("登録完了")).toBeInTheDocument();
      });
    });

    it("未入力で登録ボタンを押すとバリデーションエラーが表示される", async () => {
      fireEvent.click(screen.getByRole("button", { name: "登録" }));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("登録失敗時にエラーメッセージが表示される", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, text: () => Promise.resolve("登録失敗") });

      fireEvent.change(screen.getByRole("textbox", { name: /^名前$/ }), { target: { value: "テストユーザー" } });
      fireEvent.change(screen.getByRole("textbox", { name: /^チーム$/ }), { target: { value: "開発" } });
      fireEvent.change(screen.getByRole("textbox", { name: /^メールアドレス$/ }), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText(/パスワード/, { selector: 'input' }), { target: { value: "password123" } });

      fireEvent.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(screen.getByText("登録失敗")).toBeInTheDocument();
      });
    });

    it("ネットワークエラー時にエラーメッセージが表示される", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

      fireEvent.change(screen.getByRole("textbox", { name: /^名前$/ }), { target: { value: "テストユーザー" } });
      fireEvent.change(screen.getByRole("textbox", { name: /^チーム$/ }), { target: { value: "開発" } });
      fireEvent.change(screen.getByRole("textbox", { name: /^メールアドレス$/ }), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText(/パスワード/, { selector: 'input' }), { target: { value: "password123" } });

      fireEvent.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(screen.getByText("登録に失敗しました")).toBeInTheDocument();
      });
    });
  });
}); 