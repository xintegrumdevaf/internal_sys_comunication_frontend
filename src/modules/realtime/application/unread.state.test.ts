import { describe, it, expect, beforeEach } from "vitest";
import {
  setUnreadConversations,
  markConversationUnread,
  markConversationRead,
  setActiveChatId,
  setTotalUnread,
  incrementUnreadTotal,
  getUnreadSnapshot,
  _resetUnreadStateForTesting,
} from "./unread.state";

describe("unread.state", () => {
  beforeEach(() => {
    _resetUnreadStateForTesting();
  });

  it("calculates unread count based on unique unread conversation ids", () => {
    setUnreadConversations(["conv-1", "conv-2", "conv-3"]);
    expect(getUnreadSnapshot()).toBe(3);
  });

  it("does not increment badge multiple times for the same conversation", () => {
    setUnreadConversations(["conv-1"]);
    expect(getUnreadSnapshot()).toBe(1);

    markConversationUnread("conv-1");
    markConversationUnread("conv-1");
    expect(getUnreadSnapshot()).toBe(1);

    markConversationUnread("conv-2");
    expect(getUnreadSnapshot()).toBe(2);
  });

  it("does not mark conversation as unread if it is the currently active chat", () => {
    setActiveChatId("conv-active");
    markConversationUnread("conv-active");
    expect(getUnreadSnapshot()).toBe(0);

    markConversationUnread("conv-other");
    expect(getUnreadSnapshot()).toBe(1);
  });

  it("decrements unread count when conversation is marked as read or opened", () => {
    setUnreadConversations(["conv-1", "conv-2"]);
    expect(getUnreadSnapshot()).toBe(2);

    markConversationRead("conv-1");
    expect(getUnreadSnapshot()).toBe(1);

    setActiveChatId("conv-2");
    expect(getUnreadSnapshot()).toBe(0);
  });

  it("supports backwards-compatible setTotalUnread and incrementUnreadTotal", () => {
    setTotalUnread(5);
    expect(getUnreadSnapshot()).toBe(5);

    incrementUnreadTotal();
    expect(getUnreadSnapshot()).toBe(6);

    incrementUnreadTotal("conv-specific");
    expect(getUnreadSnapshot()).toBe(1);
  });
});
