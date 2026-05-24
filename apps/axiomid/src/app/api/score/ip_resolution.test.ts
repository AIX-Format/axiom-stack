import test from "node:test";
import assert from "node:assert/strict";
import { getClientIp } from "../../../lib/ip";

test("getClientIp - prioritizes request.ip", () => {
    const req = {
        ip: "1.2.3.4",
        headers: new Map([
            ["x-forwarded-for", "5.6.7.8"],
            ["x-real-ip", "9.10.11.12"],
        ]),
    };
    const requestStub = {
        ...req,
        headers: { get: (name: string) => req.headers.get(name) }
    } as any;

    const ip = getClientIp(requestStub);
    assert.strictEqual(ip, "1.2.3.4");
});

test("getClientIp - falls back to x-forwarded-for (first entry)", () => {
    const req = {
        ip: undefined,
        headers: new Map([
            ["x-forwarded-for", "5.6.7.8, 127.0.0.1"],
            ["x-real-ip", "9.10.11.12"],
        ]),
    };
    const requestStub = {
        ...req,
        headers: { get: (name: string) => req.headers.get(name) }
    } as any;

    const ip = getClientIp(requestStub);
    assert.strictEqual(ip, "5.6.7.8");
});

test("getClientIp - falls back to x-real-ip", () => {
    const req = {
        ip: undefined,
        headers: new Map([
            ["x-real-ip", "9.10.11.12"],
        ]),
    };
    const requestStub = {
        ...req,
        headers: { get: (name: string) => req.headers.get(name) }
    } as any;

    const ip = getClientIp(requestStub);
    assert.strictEqual(ip, "9.10.11.12");
});

test("getClientIp - returns unknown if no IP found", () => {
    const req = {
        ip: undefined,
        headers: new Map(),
    };
    const requestStub = {
        ...req,
        headers: { get: (name: string) => req.headers.get(name) }
    } as any;

    const ip = getClientIp(requestStub);
    assert.strictEqual(ip, "unknown");
});
