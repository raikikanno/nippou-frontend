import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../page";
import { Provider as JotaiProvider, createStore } from "jotai";
import { userAtom } from "@/atoms/user";
import { useRouter } from "next/navigation";

// next/navigation のモック
jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return { ...actual, useRouter: jest.fn() };
});

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトのfetchモックを設定
    (global.fetch as jest.Mock) = jest.fn();
  });

  const setup = () => {
    const store = createStore();
    const router = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(router);

    render(
      <JotaiProvider store={store}>
        <LoginPage />
      </JotaiProvider>
    );

    return { store, router };
  };

  describe("ログイン機能", () => {
    it("ログイン成功時にユーザー情報が保存され、/reports に遷移する", async () => {
      const { store, router } = setup();
      const mockUser = {
        id: "user-1",
        name: "テストユーザー",
        team: "開発",
        email: "test@example.com",
        verified: true,
      };

      // ログインAPIのモック
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve({ ok: true })) // ログイン
        .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockUser) })); // /me

      fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "password123" } });

      fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

      // ログインAPIが呼ばれることを確認
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/auth\/login$/),
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com", password: "password123" }),
            credentials: "include",
          })
        );
      });

      // ユーザー情報が保存され、/reports に遷移することを確認
      await waitFor(() => {
        expect(store.get(userAtom)).toEqual(mockUser);
        expect(router.push).toHaveBeenCalledWith("/reports");
      });
    });

    it("ログイン失敗時にエラーメッセージが表示される", async () => {
      setup();
      const errorMessage = "メールアドレスもしくはパスワードが間違っています";

      // ログインAPIのモック（失敗）
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          text: () => Promise.resolve(errorMessage),
        })
      );

      // フォーム入力
      fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "wrong-password" } });

      // ログインボタンクリック
      fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("ネットワークエラー時に適切なエラーメッセージが表示される", async () => {
      setup();

      // ネットワークエラーのモック
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error("Network Error")));

      fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "password123" } });

      fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

      await waitFor(() => {
        expect(screen.getByText("ログインに失敗しました")).toBeInTheDocument();
      });
    });
  });

  describe("バリデーション", () => {
    it("メールアドレスとパスワードが未入力の場合、フォームが送信されない", async () => {
      setup();

      fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

      // fetchが呼ばれていないことを確認
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("ナビゲーション", () => {
    it("パスワード再設定ページへのリンクが存在する", () => {
      setup();
      const link = screen.getByRole("link", { name: "パスワードを忘れた方はこちら" });
      expect(link).toHaveAttribute("href", "/forgot-password");
    });
  });
}); 