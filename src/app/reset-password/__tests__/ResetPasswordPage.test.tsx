import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ResetPasswordPage from "../page";
import { useSearchParams, useRouter } from "next/navigation";

process.env.NEXT_PUBLIC_API_URL = "http://localhost";

// next/navigationのモック
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// fetchのモック型定義を追加
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe("ResetPasswordPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockFetch.mockClear();
  });

  const setup = (token: string | null = "valid-token") => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => token,
    });
    render(<ResetPasswordPage />);
  };

  it("トークンが無効な場合はエラーメッセージを表示する", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("")
    } as Response);

    await act(async () => {
      setup("invalid-token");
    });

    await waitFor(async () => {
      expect(screen.getByText("このトークンは無効または期限切れです。")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(mockFetch).toHaveBeenCalledWith("http://localhost/api/auth/verify-reset-token?token=invalid-token");
  });

  it("パスワードを入力して再設定ボタンを押すと成功する", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("")
      } as Response) // トークン検証
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("パスワードを再設定しました")
      } as Response); // パスワード再設定

    await act(async () => {
      setup();
    });

    await waitFor(async () => {
      expect(screen.getByLabelText("新しいパスワード")).toBeInTheDocument();
    }, { timeout: 3000 });

    await act(async () => {
      fireEvent.change(screen.getByLabelText("新しいパスワード"), { target: { value: "newpassword123" } });
      fireEvent.click(screen.getByRole("button", { name: "再設定" }));
    });

    await waitFor(async () => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost/api/auth/reset-password",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "valid-token", newPassword: "newpassword123" }),
        })
      );
      expect(screen.getByText("パスワードを再設定しました")).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    }, { timeout: 2000 });
  });

  it("パスワードが空の場合は再設定ボタンを押してもfetchが呼ばれない", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("")
    } as Response); // トークン検証

    await act(async () => {
      setup();
    });

    await waitFor(async () => {
      expect(screen.getByLabelText("新しいパスワード")).toBeInTheDocument();
    }, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "再設定" }));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1); 
    });
  });

  it("ネットワークエラー時にエラーメッセージが表示される", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("")
      } as Response) // トークン検証
      .mockRejectedValueOnce(new Error("Network Error")); // パスワード再設定

    await act(async () => {
      setup();
    });

    await waitFor(async () => {
      expect(screen.getByLabelText("新しいパスワード")).toBeInTheDocument();
    }, { timeout: 3000 });

    await act(async () => {
      fireEvent.change(screen.getByLabelText("新しいパスワード"), { target: { value: "newpassword123" } });
      fireEvent.click(screen.getByRole("button", { name: "再設定" }));
    });

    await waitFor(async () => {
      expect(screen.getByText("パスワードリセットに失敗しました")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
