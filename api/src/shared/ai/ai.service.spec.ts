import axios from "axios";
import { ErrorCode } from "../../common/errors/error-codes";
import { AiService } from "./ai.service";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const streamOf = (lines: string[]): AsyncIterable<Buffer> => ({
  async *[Symbol.asyncIterator]() {
    for (const line of lines) {
      yield Buffer.from(`${line}\n`);
    }
  },
});

const build = (apiKey: string | null = "sk-test") => {
  const config = {
    get: jest.fn(() => ({
      apiKey,
      model: "deepseek-chat",
      baseUrl: "https://ai.example",
      timeoutMs: 1000,
    })),
  };
  return new AiService(config as any);
};

describe("AiService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws AI_UNAVAILABLE when no API key is configured", async () => {
    const service = build(null);
    const iterator = service.streamChat([]);
    await expect(iterator.next()).rejects.toMatchObject({
      response: { code: ErrorCode.AI_UNAVAILABLE },
    });
  });

  it("streams content tokens", async () => {
    const service = build();
    mockedAxios.post.mockResolvedValue({
      data: streamOf([
        'data: {"choices":[{"delta":{"content":"Hi "}}]}',
        'data: {"choices":[{"delta":{"content":"there"}}]}',
        "data: [DONE]",
      ]),
    } as any);

    const events = [];
    for await (const chunk of service.streamChat([])) events.push(chunk);

    expect(events).toEqual([
      { type: "token", delta: "Hi " },
      { type: "token", delta: "there" },
    ]);
  });

  it("ignores malformed/keep-alive frames", async () => {
    const service = build();
    mockedAxios.post.mockResolvedValue({
      data: streamOf([
        ": keep-alive",
        "data: not-json",
        'data: {"choices":[]}',
      ]),
    } as any);

    const events = [];
    for await (const chunk of service.streamChat([])) events.push(chunk);
    expect(events).toEqual([]);
  });

  it("maps provider failures to AI_UNAVAILABLE", async () => {
    const service = build();
    mockedAxios.post.mockRejectedValue(new Error("network"));
    mockedAxios.isAxiosError.mockReturnValue(true);

    const iterator = service.streamChat([]);
    await expect(iterator.next()).rejects.toMatchObject({
      response: { code: ErrorCode.AI_UNAVAILABLE },
    });
  });

  it("maps non-axios and non-Error failures", async () => {
    const service = build();
    mockedAxios.post.mockRejectedValue(new Error("plain"));
    mockedAxios.isAxiosError.mockReturnValue(false);
    await expect(service.streamChat([]).next()).rejects.toMatchObject({
      response: { code: ErrorCode.AI_UNAVAILABLE },
    });

    mockedAxios.post.mockRejectedValue("weird");
    await expect(service.streamChat([]).next()).rejects.toMatchObject({
      response: { code: ErrorCode.AI_UNAVAILABLE },
    });
  });
});
