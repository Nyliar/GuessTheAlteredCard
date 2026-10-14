import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { callbackRedirectUri, loginFailureLocation, tokenBody } from "../server/reunionAuth";
import { authorizeQuery, clearUserCookie, loginError, userCookie, userFromCookie } from "./reunion";

describe("reunion login", () => {
  it("builds the same authorization request as Alteredle", () => {
    const query = new URLSearchParams(authorizeQuery({
      clientId: "GuessTheAlteredCard",
      redirectUri: "http://localhost/auth",
    }));
    assert.equal(query.get("client_id"), "GuessTheAlteredCard");
    assert.equal(query.get("response_type"), "code");
    assert.equal(query.get("scope"), "openid profile");
    assert.equal(query.get("redirect_uri"), "http://localhost/auth");
    assert.equal(query.get("code_challenge"), null);
  });

  it("sends the client secret when exchanging the code", () => {
    const body = new URLSearchParams(tokenBody({
      clientId: "GuessTheAlteredCard",
      clientSecret: "secret-1",
      code: "code-1",
      redirectUri: "http://localhost/auth",
    }));
    assert.equal(body.get("grant_type"), "authorization_code");
    assert.equal(body.get("client_id"), "GuessTheAlteredCard");
    assert.equal(body.get("client_secret"), "secret-1");
    assert.equal(body.get("code"), "code-1");
    assert.equal(body.get("redirect_uri"), "http://localhost/auth");
    assert.equal(body.get("code_verifier"), null);
  });

  it("uses the host from the callback so the redirect matches", () => {
    assert.equal(callbackRedirectUri("localhost"), "http://localhost/auth");
    assert.equal(loginFailureLocation("Invalid client"), "/?auth_error=Invalid%20client");
    assert.equal(loginError("?auth_error=Invalid%20client"), "Invalid client");
  });

  it("keeps the player name in a cookie", () => {
    const header = userCookie({ pseudo: "Ada", sub: "player-1" });
    assert.equal(userFromCookie(header)?.pseudo, "Ada");
    assert.equal(userFromCookie(header)?.sub, "player-1");
    assert.equal(userFromCookie(clearUserCookie()), null);
    assert.equal(userFromCookie(""), null);
  });
});
