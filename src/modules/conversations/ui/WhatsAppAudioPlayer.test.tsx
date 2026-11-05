import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhatsAppAudioPlayer } from "./WhatsAppAudioPlayer";

const originalPlay = HTMLMediaElement.prototype.play;

afterEach(() => {
  cleanup();
  HTMLMediaElement.prototype.play = originalPlay;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WhatsAppAudioPlayer", () => {
  it("reproduce desde un blob y no usa el 206 cacheado del API", async () => {
    const mediaUrl = "https://api.example/api/media?url=voice-note-206";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3, 4]), {
        status: 206,
        headers: { "Content-Type": "audio/ogg" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal(
      "AudioContext",
      class {
        decodeAudioData() {
          return Promise.reject(new Error("sin decodificar en test"));
        }
        close() {
          return Promise.resolve();
        }
      },
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:voice-note");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.play = play;

    render(<WhatsAppAudioPlayer mediaUrl={mediaUrl} messageId="msg-1" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(mediaUrl, {
        credentials: "include",
        cache: "no-store",
      });
    });

    const audio = document.querySelector("audio");
    expect(audio).not.toBeNull();
    await waitFor(() => {
      expect(audio).toHaveAttribute("src", "blob:voice-note");
    });
    expect(audio).not.toHaveAttribute("crossorigin");

    fireEvent.click(screen.getByRole("button", { name: "Reproducir audio" }));

    await waitFor(() => {
      expect(play).toHaveBeenCalledTimes(1);
    });
  });
});
