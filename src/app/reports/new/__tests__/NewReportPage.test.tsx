import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import NewReportPage from "../page";
import { Provider as JotaiProvider, createStore } from "jotai";
import { userAtom } from "@/atoms/user";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("NewReportPage", () => {
  const mockUser = {
    id: "user-1",
    name: "テストユーザー",
    team: "開発",
    email: "test@example.com",
    verified: true,
  };

  const mockTags = ["API", "フロントエンド", "バックエンド"];

  beforeEach(() => {
    jest.clearAllMocks();
    // タグ取得のモック
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/api/reports/tags")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTags),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
  });

  const setup = () => {
    const store = createStore();
    store.set(userAtom, mockUser);

    render(
      <JotaiProvider store={store}>
        <NewReportPage />
      </JotaiProvider>
    );
  };

  it("内容未入力で投稿ボタンを押すとバリデーションエラーが表示される", async () => {
    await act(async () => {
      setup();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /投稿/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("内容を入力してください")).toBeInTheDocument();
    });
  });

  it("タグが正しく取得され、表示される", async () => {
    setup();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/reports\/tags$/)
      );
    });

    // タグの入力フィールドが存在することを確認
    expect(screen.getByLabelText("タグ")).toBeInTheDocument();
  });
});
