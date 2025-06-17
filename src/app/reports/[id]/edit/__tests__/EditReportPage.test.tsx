import EditReportPage from "../page";
import { Provider as JotaiProvider, createStore } from "jotai";
import { userAtom } from "@/atoms/user";
import { reportsAtom } from "@/atoms/reports";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Report } from "@/types";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "report-1" }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

interface SetupOptions {
  initialUser?: {
    id: string;
    name: string;
    team: string;
    email: string;
    verified: boolean;
  };
      initialReport?: Report;
}

const setup = async (options: SetupOptions = {}) => {
  const store = createStore();
  const mockUser = options.initialUser ?? {
    id: "user-1",
    name: "テストユーザー",
    team: "開発",
    email: "test@example.com",
    verified: true,
  };

  const mockReport: Report = options.initialReport ?? {
    id: "report-1",
    userId: "user-1",
    userName: "テストユーザー",
    team: "開発",
    tags: [{ name: "開発" }],
    content: "テスト内容",
    date: "2024-01-01",
    createdAt: "2024-01-01T09:00:00Z",
  };

  store.set(userAtom, mockUser);
  store.set(reportsAtom, [mockReport]);

  await act(async () => {
    render(
      <JotaiProvider store={store}>
        <EditReportPage />
      </JotaiProvider>
    );
  });
};

describe("EditReportPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
  });

  it("初期値がフォームに表示される", async () => {
    const mockUser = {
      id: "user-1",
      name: "テストユーザー",
      team: "開発",
      email: "test@example.com",
      verified: true,
    };

    const mockReports = [
      {
        id: "report-1",
        userId: "user-1",
        userName: "テストユーザー",
        team: "開発",
        date: "2024-01-01",
        tags: [{ name: "開発" }, { name: "会議" }],
        content: "昨日はAPIを実装しました。",
        createdAt: "2024-01-01T09:00:00Z",
      },
    ];

    const store = createStore();
    store.set(userAtom, mockUser);
    store.set(reportsAtom, mockReports);

    await act(async () => {
      render(
        <JotaiProvider store={store}>
          <EditReportPage />
        </JotaiProvider>
      );
    });

    await waitFor(() => {
      const editor = screen.getByLabelText("内容");
      expect(editor.querySelector('.ProseMirror')?.textContent).toContain("昨日はAPIを実装しました。");
      expect(screen.getByText("開発")).toBeInTheDocument();
      expect(screen.getByText("会議")).toBeInTheDocument();
    });
  });
  it("更新ボタンを押すと fetch が呼ばれる", async () => {
    const mockReport: Report = {
      id: "report-1",
      userId: "user-1",
      userName: "テストユーザー",
      team: "開発",
      tags: [{ name: "開発" }],
      content: "新しい内容",
      date: "2024-01-01",
      createdAt: "2024-01-01T09:00:00Z",
    };

    await setup({ initialReport: mockReport });

    const updateButton = screen.getByRole("button", { name: /更新/i });
    await act(async () => {
      fireEvent.click(updateButton);
    });

    // fetchの呼び出しを確認
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/reports\/report-1$/),
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining("新しい内容"),
        })
      );
    });
  });
  beforeAll(() => {
    window.alert = jest.fn();
  });

  it("内容が空のまま送信するとバリデーションエラーが表示される", async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;

    const mockUser = {
      id: "user-1",
      name: "テストユーザー",
      team: "開発",
      email: "test@example.com",
      verified: true,
    };

    const mockReports = [
      {
        id: "report-1",
        userId: "user-1",
        userName: "テストユーザー",
        team: "開発",
        date: "2024-01-01",
        tags: [{ name: "開発" }],
        content: "元の内容",
        createdAt: "2024-01-01T09:00:00Z",
      },
    ];

    const store = createStore();
    store.set(userAtom, mockUser);
    store.set(reportsAtom, mockReports);

    await act(async () => {
      render(
        <JotaiProvider store={store}>
          <EditReportPage />
        </JotaiProvider>
      );
    });

    // エディタの内容を空にする
    const editor = screen.getByLabelText("内容");
    await act(async () => {
      const editorElement = editor.querySelector('.ProseMirror');
      if (editorElement) {
        editorElement.innerHTML = '<p></p>';
        fireEvent.blur(editorElement);
      }
    });

    // タグを削除
    const cancelIcons = screen.queryAllByTestId("CancelIcon");
    await act(async () => {
      cancelIcons.forEach((icon) => fireEvent.click(icon));
    });

    // 送信
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /更新/i }));
    });

    // バリデーションエラーメッセージの確認
    await waitFor(() => {
      expect(screen.getByText("内容を入力してください")).toBeInTheDocument();
    });

    // fetchは呼ばれていないことを確認
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
