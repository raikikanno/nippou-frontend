import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPasswordPage from "../page";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  const setup = () => {
    render(<ForgotPasswordPage />);
  };

  it("メールアドレスを入力しメール送信ボタンを押すとfetchが呼ばれ、メッセージが表示される", async () => {
    setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("送信完了") });

    fireEvent.change(screen.getByLabelText("登録メールアドレス"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "メール送信" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/auth\/forgot-password$/),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        })
      );
      expect(screen.getByText("送信完了")).toBeInTheDocument();
    });
  });

  it("未入力でメール送信ボタンを押すとfetchが呼ばれない", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "メール送信" }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("ネットワークエラー時にエラーメッセージが表示される", async () => {
    setup();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

    fireEvent.change(screen.getByLabelText("登録メールアドレス"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "メール送信" }));

    await waitFor(() => {
      expect(screen.getByText("パスワードリセットに失敗しました")).toBeInTheDocument();
    });
  });
}); 