// Prevent group messages, impersonation, and duplicate delivery IDs from creating mobile tasks.
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { mobileTask, mobileInbox } from "../plugins/feishu/mobile.ts";

test("only the owner's private text becomes a task keyed by message ID", () => {
  const message = {
    chat_type: "p2p",
    sender_type: "user",
    sender_id: "ou_owner",
    message_type: "text",
    message_id: "om_123",
    event_id: "evt_1",
    content: "检查测试",
  };
  assert.deepEqual(mobileTask(message, "ou_owner"), {
    id: "om_123",
    type: "mobile.task",
    subject: "om_123",
    summary: "检查测试",
    detail: "检查测试",
  });
  assert.equal(mobileTask({ ...message, event_id: "evt_2" }, "ou_owner")?.id, "om_123");
  assert.equal(mobileTask({ ...message, sender_id: "ou_other" }, "ou_owner"), null);
  assert.equal(mobileTask({ ...message, chat_type: "group" }, "ou_owner"), null);
  assert.equal(mobileTask({ ...message, message_type: "image" }, "ou_owner"), null);
});

test("a phone task remains in the local inbox across a restart until acknowledged", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mobile-inbox-"));
  try {
    const task = { id: "om_123", type: "mobile.task", subject: "om_123", summary: "检查测试", detail: "检查测试" };
    mobileInbox(dir).save(task);
    assert.deepEqual(mobileInbox(dir).pending(), [task]);
    mobileInbox(dir).done(task.id);
    assert.deepEqual(mobileInbox(dir).pending(), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
