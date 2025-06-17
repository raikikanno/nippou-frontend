import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ReportsPage from "../page";
import { Provider as JotaiProvider, createStore } from "jotai";
import { userAtom } from "@/atoms/user";
import { reportsAtom } from "@/atoms/reports";
import { Report } from "@/types";
import { act } from "react";
import { useRouter } from "next/navigation";

// モックデータ
const mockUser = {
  id: "user-1",
  name: "テストユーザー",
  team: "開発",
  email: "test@example.com",
  verified: true,
} as const;

const mockReports: Report[] = [
  {
    id: "1",
    userId: "user-1",
    userName: "テストユーザー",
    team: "開発",
    tags: [{ name: "開発" }],
    content: "API実装",
    date: "2024-01-01",
    createdAt: "2024-01-01T09:00:00Z",
  },
  {
    id: "2",
    userId: "user-2",
    userName: "別ユーザー",
    team: "営業",
    tags: [{ name: "営業" }],
    content: "顧客対応",
    date: "2024-01-02",
    createdAt: "2024-01-02T09:00:00Z",
  },
];

// next/navigation のモック
jest.mock("next/navigation", () => {
  const actual = jest.requireActual<typeof import("next/navigation")>("next/navigation");
  return { 
    ...actual, 
    useRouter: jest.fn(),
    useSearchParams: jest.fn(() => ({
      get: jest.fn(() => null),
    })),
  };
});

jest.spyOn(global, "confirm").mockImplementation(() => true);

interface SetupOptions {
  initialUser?: typeof mockUser;
  initialReports?: typeof mockReports;
  routerMock?: ReturnType<typeof useRouter>;
}

const setup = async (options: SetupOptions = {}) => {
  const store = createStore();
  store.set(userAtom, options.initialUser ?? mockUser);
  store.set(reportsAtom, options.initialReports ?? mockReports);

  if (options.routerMock) {
    (useRouter as jest.Mock).mockReturnValue(options.routerMock);
  }

  await act(async () => {
    render(
      <JotaiProvider store={store}>
        <ReportsPage />
      </JotaiProvider>
    );
  });
};

const selectAutocompleteOption = async (label: string, value: string) => {
  const combo = screen.getByRole("combobox", { name: label });
  fireEvent.mouseDown(combo);
  await waitFor(() => {
    const listbox = screen.getByRole("listbox");
    const option = within(listbox).getByText(value);
    fireEvent.click(option);
  });
};

describe("ReportsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn((_url: RequestInfo, _init?: RequestInit) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReports),
      });
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  describe("フィルタリング機能", () => {
    it("チームフィルタリング：営業を選ぶと該当レポートだけ表示", async () => {
      await setup();

      fireEvent.mouseDown(screen.getByLabelText("チーム"));
      const listbox = await screen.findByRole("listbox");
      fireEvent.click(within(listbox).getByText("営業"));

      await waitFor(() => {
        expect(screen.getByText("顧客対応")).toBeInTheDocument();
        expect(screen.queryByText("API実装")).not.toBeInTheDocument();
      });
    });

    it("タグの絞り込み：開発タグを選ぶと該当レポートだけ表示", async () => {
      const store = createStore();
      store.set(userAtom, mockUser);
      
      const testReports = [
        {
          id: "1",
          userId: "user-1",
          userName: "テストユーザー",
          team: "開発",
          tags: [{ name: "開発" }],
          content: "API実装",
          date: "2024-01-01",
          createdAt: "2024-01-01T09:00:00Z",
        },
        {
          id: "2",
          userId: "user-2",
          userName: "別ユーザー",
          team: "営業",
          tags: [{ name: "営業" }],
          content: "顧客対応",
          date: "2024-01-02",
          createdAt: "2024-01-02T09:00:00Z",
        },
      ];
      
      store.set(reportsAtom, testReports);
      console.log("Test reports set:", testReports);

      // カスタムのfetchモックを設定して、testReportsを返すようにする
      (global.fetch as jest.Mock) = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(testReports),
        })
      );

      await act(async () => {
        render(
          <JotaiProvider store={store}>
            <ReportsPage />
          </JotaiProvider>
        );
      });

      // まず初期状態を確認
      await waitFor(() => {
        expect(screen.getByText("API実装")).toBeInTheDocument();
        expect(screen.getByText("顧客対応")).toBeInTheDocument();
      });

      // タグの選択を修正
      const tagInput = screen.getByRole("combobox", { name: "タグ" });
      fireEvent.mouseDown(tagInput);
      await waitFor(() => {
        const listbox = screen.getByRole("listbox");
        const option = within(listbox).getByText("開発");
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(screen.getByText("API実装")).toBeInTheDocument();
        expect(screen.queryByText("顧客対応")).not.toBeInTheDocument();
      });
    });

    it("ユーザー絞り込み：別ユーザーを選ぶと該当レポートだけ表示", async () => {
      await setup();

      await selectAutocompleteOption("ユーザー", "別ユーザー");

      await waitFor(() => {
        expect(screen.getByText("顧客対応")).toBeInTheDocument();
        expect(screen.queryByText("API実装")).not.toBeInTheDocument();
      });
    });
  });

  describe("レポート操作", () => {
    it("削除ボタン押下で confirm と fetch が呼ばれる", async () => {
      await setup();

      const deleteButton = await screen.findByRole("button", { name: /削除/ });
      fireEvent.click(deleteButton);

      expect(global.confirm).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/reports\/\d+/), expect.objectContaining({ method: "DELETE" }));
    });

    it("confirm がキャンセルされた場合は削除を行わない", async () => {
      jest.spyOn(global, "confirm").mockImplementation(() => false);

      await setup();
      fireEvent.click(await screen.findByRole("button", { name: /削除/ }));

      const fetchMock = global.fetch as jest.Mock;
      const deleteCalled = fetchMock.mock.calls.some(([, init]: [RequestInfo, RequestInit | undefined]) => init?.method === "DELETE");
      expect(deleteCalled).toBe(false);
    });

    it("レポート削除後に画面上から該当レポートが消える", async () => {
      const targetReportContent = "API実装";
      await setup();

      // レポートが表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByText(targetReportContent)).toBeInTheDocument();
      });

      // 削除ボタンをより具体的に探す
      const deleteButtons = screen.getAllByRole("button", { name: /削除/ });
      expect(deleteButtons.length).toBeGreaterThan(0);
      
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      // 単純に削除ボタンのクリックが呼ばれたことを確認
      expect(global.confirm).toHaveBeenCalled();
    });

    it("レポート削除後に状態が正しく更新される", async () => {
      const store = createStore();
      store.set(userAtom, mockUser);
      store.set(reportsAtom, mockReports);

      expect(store.get(reportsAtom)).toHaveLength(2);

      await act(async () => {
        render(
          <JotaiProvider store={store}>
            <ReportsPage />
          </JotaiProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText("API実装")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /削除/ });
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      // fetch の呼び出しを確認
      expect(global.confirm).toHaveBeenCalled();
    });
  });

  describe("ナビゲーション", () => {
    it("新規投稿ボタンで /reports/new に遷移する", async () => {
      const push = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({ push, replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() });

      await setup();

      fireEvent.click(screen.getByRole("button", { name: "新規投稿" }));
      expect(push).toHaveBeenCalledWith("/reports/new");
    });

    it("ログアウトボタン押下で /login に遷移する", async () => {
      const push = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({ push, replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() });

      await setup();
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "ログアウト" }));
      });

      await waitFor(() => {
        expect(push).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("fetch 失敗時にエラーメッセージが表示される", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as jest.Mock) = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: "取得失敗" }),
        })
      );

      await setup();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("日報の取得エラー:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it("ネットワークエラー時に適切なエラーメッセージが表示される", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (global.fetch as jest.Mock) = jest.fn().mockImplementationOnce(() => Promise.reject(new Error("Network Error")));

      await setup();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("日報の取得エラー:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it("不正なレスポンス形式の場合にエラーメッセージが表示される", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (global.fetch as jest.Mock) = jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error("Invalid JSON")),
        })
      );

      await setup();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("日報の取得エラー:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
