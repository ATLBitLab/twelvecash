import init from './dnssec_prover_wasm.js';
import * as wasm from './dnssec_prover_wasm.js';

/**
* Asynchronously resolves a given domain and type using the provided DoH endpoint, then verifies
* the returned DNSSEC data and ultimately returns a JSON-encoded list of validated records.
*/
export async function lookup_doh(domain, ty, doh_endpoint) {
	await init();

	if (!domain.endsWith(".")) domain += ".";
	if (ty.toLowerCase() == "txt") {
		ty = 16;
	} else if (ty.toLowerCase() == "tlsa") {
		ty = 52;
	} else if (ty.toLowerCase() == "a") {
		ty = 1;
	} else if (ty.toLowerCase() == "aaaa") {
		ty = 28;
	}
	if (typeof(ty) == "number") {
		var builder = wasm.init_proof_builder(domain, ty);
		if (builder == null) {
			return "{\"error\":\"Bad domain\"}";
		} else {
			var queries_pending = 0;
			var send_next_query;
			send_next_query = async function() {
				var query = wasm.get_next_query(builder);
				if (query != null) {
					queries_pending += 1;
					var b64 = btoa(String.fromCodePoint(...query));
					var b64url = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
					try {
						var resp = await fetch(doh_endpoint + "?dns=" + b64url,
							{headers: {"accept": "application/dns-message"}});
						if (!resp.ok) { throw "Query returned HTTP " + resp.status; }
						var array = await resp.arrayBuffer();
						var buf = new Uint8Array(array);
						wasm.process_query_response(builder, buf);
						queries_pending -= 1;
					} catch (e) {
						return "{\"error\":\"DoH Query failed: " + e + "\"}";
					}
					return await send_next_query();
				} else if (queries_pending == 0) {
					var proof = wasm.get_unverified_proof(builder);
					if (proof != null) {
						var result = wasm.verify_byte_stream(proof, domain);
						return JSON.stringify(JSON.parse(result), null, 1);
					} else {
						return "{\"error\":\"Failed to build proof\"}";
					}
				}
			}
			return await send_next_query();
		}
	} else {
		return "{\"error\":\"Unsupported Type\"}";
	}
}
