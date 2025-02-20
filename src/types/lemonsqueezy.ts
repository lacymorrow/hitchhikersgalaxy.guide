/**
 * Check if the value is an object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * Typeguard to check if the object has a 'meta' property
 * and that the 'meta' property has the correct shape.
 */
export interface LemonSqueezyWebhookMeta {
	meta: {
		test_mode: boolean;
	};
}

export function webhookHasMeta(data: any): data is LemonSqueezyWebhookMeta {
	return data && typeof data === "object" && "meta" in data;
}

/**
 * Type for Lemon Squeezy order attributes
 */
export interface LemonSqueezyOrderAttributes {
	store_id: number;
	identifier: string;
	order_number: number;
	user_name: string | null;
	user_email: string | null;
	currency: string;
	currency_rate: string;
	subtotal: number;
	discount_total: number;
	tax: number;
	total: number;
	subtotal_usd: number;
	discount_total_usd: number;
	tax_usd: number;
	total_usd: number;
	tax_name: string | null;
	tax_rate: string | null;
	status: string;
	status_formatted: string;
	refunded: boolean;
	refunded_at: string | null;
	subtotal_formatted: string;
	discount_total_formatted: string;
	tax_formatted: string;
	total_formatted: string;
	first_order_item: {
		id: number;
		order_id: number;
		product_id: number;
		variant_id: number;
		product_name: string;
		variant_name: string;
		price: number;
		created_at: string;
		updated_at: string;
	};
	urls: {
		receipt: string;
	};
	created_at: string;
	updated_at: string;
	test_mode: boolean;
	custom_data?: Record<string, unknown>;
}

/**
 * Typeguard to check if the object has a 'data' property and the correct shape.
 *
 * @param obj - The object to check.
 * @returns True if the object has a 'data' property.
 */
export function webhookHasData(obj: unknown): obj is {
	data: {
		attributes: LemonSqueezyOrderAttributes & {
			first_subscription_item: {
				id: number;
				price_id: number;
				is_usage_based: boolean;
			};
		};
		id: string;
	};
} {
	return (
		isObject(obj) &&
		"data" in obj &&
		isObject(obj.data) &&
		"attributes" in obj.data
	);
}
