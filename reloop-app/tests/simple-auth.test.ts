import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createSimpleAccount,
  loginSimpleAccount,
  resetSimpleAccountPassword,
} from "../lib/auth/account-service.ts";
import { homeForRole } from "../lib/prototype/model.ts";

describe("Scrapo Simple Name & Password Authentication System", () => {
  describe("1. Account Creation with Name & Password", () => {
    it("creates an account successfully without phone or email verification", async () => {
      const res = await createSimpleAccount({
        name: "Test User One",
        password: "securePassword1",
        role: "donor",
        city: "Bengaluru",
      });

      assert.equal(res.success, true);
      assert.ok(res.user);
      assert.equal(res.user.name, "Test User One");
      assert.equal(res.user.role, "donor");
      assert.equal(res.user.city, "Bengaluru");
      assert.ok(res.user.id.startsWith("usr_"));
    });

    it("rejects names that are too short", async () => {
      const res = await createSimpleAccount({
        name: "A",
        password: "password123",
      });

      assert.equal(res.success, false);
      assert.match(res.error || "", /at least 2 characters/);
    });

    it("rejects passwords that are too short", async () => {
      const res = await createSimpleAccount({
        name: "Valid Name",
        password: "12",
      });

      assert.equal(res.success, false);
      assert.match(res.error || "", /at least 4 characters/);
    });

    it("prevents duplicate account creation with same name", async () => {
      const res = await createSimpleAccount({
        name: "Duplicate Name",
        password: "password123",
      });
      assert.equal(res.success, true);

      // Attempt duplicate
      const duplicate = await createSimpleAccount({
        name: "duplicate name",
        password: "password456",
      });
      assert.equal(duplicate.success, false);
      assert.match(duplicate.error || "", /already exists/i);
    });
  });

  describe("2. Log In with Name & Password", () => {
    it("successfully logs in with valid name and password", async () => {
      await createSimpleAccount({
        name: "Rohit Sharma",
        password: "mySecretPassword",
        role: "student",
        city: "Mumbai",
      });

      const loginRes = await loginSimpleAccount({
        name: "Rohit Sharma",
        password: "mySecretPassword",
      });

      assert.equal(loginRes.success, true);
      assert.ok(loginRes.user);
      assert.equal(loginRes.user.name, "Rohit Sharma");
      assert.equal(loginRes.user.role, "student");
    });

    it("performs case-insensitive name matching", async () => {
      const loginRes = await loginSimpleAccount({
        name: "rohit sharma",
        password: "mySecretPassword",
      });

      assert.equal(loginRes.success, true);
      assert.equal(loginRes.user?.name, "Rohit Sharma");
    });

    it("rejects login with incorrect password", async () => {
      const loginRes = await loginSimpleAccount({
        name: "Rohit Sharma",
        password: "wrongPassword999",
      });

      assert.equal(loginRes.success, false);
      assert.match(loginRes.error || "", /Incorrect password/i);
    });

    it("logs in seeded demo accounts smoothly", async () => {
      const loginRes = await loginSimpleAccount({
        name: "Ananya Iyer",
        password: "password123",
      });

      assert.equal(loginRes.success, true);
      assert.equal(loginRes.user?.role, "donor");
    });
  });

  describe("3. Password Reset", () => {
    it("updates password successfully for existing account", async () => {
      await createSimpleAccount({
        name: "Kavita Rao",
        password: "oldPassword",
        role: "recycler",
      });

      const resetRes = await resetSimpleAccountPassword({
        name: "Kavita Rao",
        newPassword: "freshPassword99",
      });
      assert.equal(resetRes.success, true);

      // Old password should now fail
      const failLogin = await loginSimpleAccount({
        name: "Kavita Rao",
        password: "oldPassword",
      });
      assert.equal(failLogin.success, false);

      // New password should succeed
      const okLogin = await loginSimpleAccount({
        name: "Kavita Rao",
        password: "freshPassword99",
      });
      assert.equal(okLogin.success, true);
    });
  });

  describe("4. Direct Role Dashboard Routing", () => {
    it("routes users directly to their correct desk without verification gates", () => {
      assert.equal(homeForRole("donor"), "/dashboard");
      assert.equal(homeForRole("student"), "/marketplace");
      assert.equal(homeForRole("recycler"), "/recycler");
      assert.equal(homeForRole("admin"), "/admin");
    });
  });
});

