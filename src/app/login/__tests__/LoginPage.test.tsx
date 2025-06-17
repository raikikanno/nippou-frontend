import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../page";
import { Provider as JotaiProvider, createStore } from "jotai";
import { userAtom, authInitializedAtom } from "@/atoms/user";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";

// next/navigation のモック
jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return { ...actual, useRouter: jest.fn() };
});

// authService のモック
jest.mock("@/services/auth", () => ({
  authService: {
    login: jest.fn(),
    getMe: jest.fn(),
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      };

      // authServiceのモック設定
      (authService.login as jest.Mock).mockResolvedValue({ data: mockUser });
      (authService.getMe as jest.Mock).mockResolvedValue({ data: mockUser });

      fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "password123" } });

      fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

      // authService.loginが呼ばれることを確認
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith("test@example.com", "password123");
      });

      // ユーザー情報が保存され、/reports に遷移することを確認
      await waitFor(() => {
        expect(store.get(userAtom)).toEqual(mockUser);
        expect(store.get(authInitializedAtom)).toBe(true);
        expect(router.push).toHaveBeenCalledWith("/reports");
      });
    });

    it("ログイン失敗時にエラーメッセージが表示される", async () => {
      setup();

      // authServiceのモック設定（ログイン失敗）
      (authService.login as jest.Mock).mockResolvedValue({ 
        error: "認証に失敗しました" 
      });

      // フォーム入力
      fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "wrong-password" } });

      // ログインボタンクリック
      fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

      await waitFor(() => {
        expect(screen.getByText("メールアドレスもしくはパスワードが間違っています")).toBeInTheDocument();
      });
    });

    it("ネットワークエラー時に適切なエラーメッセージが表示される", async () => {
      setup();

      // authServiceのモック設定（ネットワークエラー）
      (authService.login as jest.Mock).mockRejectedValue(new Error("Network Error"));

      fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "password123" } });

      fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

      await waitFor(() => {
        expect(screen.getByText("ログインに失敗しました")).toBeInTheDocument();
      });
    });

    it("ユーザー情報取得失敗時にエラーメッセージが表示される", async () => {
      setup();

      // ログインは成功するが、ユーザー情報取得に失敗
      (authService.login as jest.Mock).mockResolvedValue({ data: {} });
      (authService.getMe as jest.Mock).mockResolvedValue({ 
        error: "ユーザー情報の取得に失敗しました" 
      });

      fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "password123" } });

      fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

      await waitFor(() => {
        expect(screen.getByText("ユーザー情報の取得に失敗しました")).toBeInTheDocument();
      });
    });
  });

  describe("バリデーション", () => {
    it("メールアドレスとパスワードが未入力の場合、ログインが実行されない", async () => {
      setup();

      fireEvent.click(screen.getByRole("button", { name: "ログイン" }));

      await waitFor(() => {
        expect(screen.getByText("メールアドレスとパスワードを入力してください")).toBeInTheDocument();
      });

      // authServiceが呼ばれていないことを確認
      expect(authService.login).not.toHaveBeenCalled();
    });

    it("Enterキーでログインが実行される", async () => {
      const { router } = setup();
      const mockUser = {
        id: "user-1",
        name: "テストユーザー",
        team: "開発",
      };

      (authService.login as jest.Mock).mockResolvedValue({ data: mockUser });
      (authService.getMe as jest.Mock).mockResolvedValue({ data: mockUser });

      fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: "password123" } });

      // Enterキーを押す
      fireEvent.keyDown(screen.getByLabelText("パスワード"), { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith("test@example.com", "password123");
        expect(router.push).toHaveBeenCalledWith("/reports");
      });
    });
  });

  describe("ナビゲーション", () => {
    it("新規登録ページへのリンクが存在する", () => {
      setup();
      const link = screen.getByRole("link", { name: "新規登録はこちら" });
      expect(link).toHaveAttribute("href", "/register");
    });

    it("パスワード再設定ページへのリンクが存在する", () => {
      setup();
      const link = screen.getByRole("link", { name: "パスワードを忘れた方はこちら" });
      expect(link).toHaveAttribute("href", "/forgot-password");
    });
  });
}); 