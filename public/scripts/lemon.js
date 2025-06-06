(() => {
	(function () {
		let y = function () {
				let r = () => {};

				function g(e) {
					if (typeof e != "object" || e === null)
						throw new Error("Setup options provided must be of type object");
					e.eventHandler && (r = e.eventHandler);
				}

				function b() {
					d(),
						window.addEventListener(
							"message",
							function (e) {
								if ((w(e.data), typeof window.gtag != "undefined"))
									switch (e.data.event) {
										case "GA.ViewCart":
											window.gtag("event", "view_cart", e.data.data);
											break;
										case "GA.ApplyDiscount":
											window.gtag("event", "apply_discount", e.data.data);
											break;
										case "GA.RemoveDiscount":
											window.gtag("event", "remove_discount", e.data.data);
											break;
										case "GA.Purchase":
											window.gtag("event", "purchase", e.data.data);
											break;
										case "GA.AddPaymentInfo":
											window.gtag("event", "add_payment_info", e.data.data);
											break;
									}
								e.data === "mounted" && p(), e.data === "close" && f();
							}.bind(this),
							!1,
						);
				}

				function w(e) {
					r && r(e);
				}

				function v() {
					d();
				}

				function d() {
					document.querySelectorAll(".lemonsqueezy-button").forEach(
						function (t) {
							t.addEventListener
								? t.addEventListener("click", s.bind(this))
								: t.attachEvent && t.attachEvent("onclick", s.bind(this));
						}.bind(this),
					);
				}

				function s(e) {
					e.preventDefault(),
						!document.body.classList.contains("lemonsqueezy-open") &&
							(document.body.classList.add("lemonsqueezy-open"),
							c(e.currentTarget.href));
				}

				function c(e) {
					const url = new URL(e);
					let t = url.searchParams.get("dark");
					url.searchParams.delete("dark");
					m(t), (e = l(e, !0)), L(e);
				}

				function l(e, t = !1) {
					if (
						((e = new URL(e)),
						t && e.searchParams.set("embed", 1),
						!e.searchParams.get("aff_ref"))
					) {
						let a = h();
						a && e.searchParams.set("aff_ref", a);
					}
					return e.toString();
				}

				function L(e) {
					u(),
						(this.iframe = document.createElement("iframe")),
						(this.iframe.style =
							"z-index: 2147483647;display: block;background-color: transparent;border: 0px none transparent;overflow-x: hidden;overflow-y: auto;visibility: visible;margin: 0px;padding: 0px;-webkit-tap-highlight-color: transparent;position: fixed;left: 0px;top: 0px;width: 100%;height: 100%;"),
						(this.iframe.src = e),
						(this.iframe.allow = "payment"),
						(this.iframe.style.colorScheme = "light"),
						document.body.appendChild(this.iframe);
				}

				function u() {
					this.iframe &&
						(this.iframe.remove(),
						delete this.iframe,
						document.body.classList.remove("lemonsqueezy-open"));
				}

				function f() {
					u();
				}

				function m(e) {
					let t = document.createElement("style");
					(t.innerHTML =
						"@keyframes pulse { 0% { opacity: 1; transform: scale(0.1); } 100% { opacity: 0; transform: scale(1); } }"),
						document.head.appendChild(t);
					let a = document.createElement("div");
					a.setAttribute(
						"style",
						"z-index:99998; display: block; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; right: 0px; bottom: 0px; margin: 0px; padding: 0px;" +
							(e
								? "background: rgba(0,0,0,0.9);"
								: "background: rgba(255,255,255,0.9);"),
					),
						a.setAttribute("class", "lemonsqueezy-loader");
					let i = document.createElement("main");
					i.setAttribute(
						"style",
						"display: flex;align-items: center;justify-content: center;flex-direction: column;width: 100%;height: 100%;",
					);
					let o = document.createElement("div");
					o.setAttribute(
						"style",
						"width: 40px;height: 40px;border-radius: 40px;animation: pulse 1s ease-out infinite forwards;" +
							(e ? "background-color: #FFC233;" : "background-color: #7047EB;"),
					),
						i.appendChild(o),
						a.appendChild(i),
						document.body.appendChild(a),
						document.body.classList.add("lemonsqueezy-loading");
				}

				function p() {
					document
						.querySelectorAll(".lemonsqueezy-loader")
						.forEach((e) => e.remove()),
						document.body.classList.remove("lemonsqueezy-loading");
				}

				function k(e) {
					for (
						var t = e + "=", a = document.cookie.split(";"), i = 0;
						i < a.length;
						i++
					) {
						for (var o = a[i]; o.charAt(0) === " "; )
							o = o.substring(1, o.length);
						if (o.indexOf(t) === 0) return o.substring(t.length, o.length);
					}
					return null;
				}

				function h() {
					return k("ls_aff_ref");
				}
				return {
					DumbSetup: b,
					Setup: g,
					Refresh: v,
					Loader: {
						Show: m,
						Hide: p,
					},
					Url: {
						Open: c,
						Close: f,
						Build: l,
					},
					Affiliate: {
						GetId: h,
					},
				};
			},
			n = window || n;
		(n.createLemonSqueezy = function () {
			n.LemonSqueezy
				? n.LemonSqueezy.Refresh()
				: ((n.LemonSqueezy = new y()), n.LemonSqueezy.DumbSetup());
		}),
			(n.createLemonSqueezyCheckout = n.createLemonSqueezy),
			n.addEventListener
				? n.addEventListener("load", n.createLemonSqueezy)
				: n.attachEvent && n.attachEvent("onload", window.createLemonSqueezy);
	})(document);
})();
