import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

// The HOC restores arbitrary JSON out of localStorage and writes it back with
// setValue, so it is schema-agnostic by nature. Keeping the form loosely typed
// here is what lets a concrete UseFormReturn<MySchema> be passed in; a bound
// generic cannot be inferred from the wrapped component's props.
interface WithFormPersistenceProps {
	form: UseFormReturn<any>;
	formKey: string;
	zodSchema: z.ZodType;
}

/**
 * Higher-order component that adds form persistence using localStorage
 * @param WrappedComponent The component to wrap
 * @param options Configuration options
 * @param options.clearOnSubmit Whether to clear stored data after successful submission
 * @param options.debounceMs Debounce time for saving to localStorage (default: 500ms)
 * @returns A wrapped component with form persistence
 */
export function withFormPersistence<P extends WithFormPersistenceProps>(
	WrappedComponent: React.ComponentType<P>,
	options: {
		clearOnSubmit?: boolean;
		debounceMs?: number;
	} = { debounceMs: 500 }
) {
	return function WithFormPersistenceWrapper(props: P) {
		const { form, formKey, zodSchema } = props;
		const initialized = useRef(false);

		// Load stored form data on mount
		useEffect(() => {
			if (initialized.current) return;
			initialized.current = true;

			try {
				const storedData = localStorage.getItem(`form_${formKey}`);
				if (storedData) {
					const parsedData = JSON.parse(storedData);

					// Always restore any non-empty values, even if they don't pass validation
					Object.entries(parsedData).forEach(([key, value]) => {
						// Only restore non-null, non-undefined, non-empty string values
						if (value !== null && value !== undefined && value !== "") {
							form.setValue(key, value, {
								shouldDirty: true,
								shouldTouch: true,
								shouldValidate: true,
							});
						}
					});
				}
			} catch (error) {
				console.error("[Form Persistence] Error loading stored form data:", error);
				// Only clear storage if it's corrupted JSON
				if (error instanceof SyntaxError) {
					localStorage.removeItem(`form_${formKey}`);
				}
			}
		}, [form, formKey, zodSchema]);

		// Subscribe to form changes and update storage
		useEffect(() => {
			let timeout: NodeJS.Timeout;

			// Subscribe to all form changes
			const subscription = form.watch((formData) => {
				// Debounce the storage update
				clearTimeout(timeout);
				timeout = setTimeout(() => {
					try {
						// Store data if any field has a non-empty value
						const hasValue = Object.values(formData as Record<string, unknown>).some(
							(value) => value !== null && value !== undefined && value !== ""
						);

						if (hasValue) {
							localStorage.setItem(
								`form_${formKey}`,
								JSON.stringify(formData)
							);
						} else {
							// Clear storage if all fields are empty
							localStorage.removeItem(`form_${formKey}`);
						}
					} catch (error) {
						console.error("[Form Persistence] Error saving form data:", error);
					}
				}, options.debounceMs);
			});

			return () => {
				subscription.unsubscribe();
				clearTimeout(timeout);
			};
		}, [form, formKey, options.debounceMs]);

		// Clear storage once a submit resolves cleanly. This used to reassign
		// form.handleSubmit during render, which re-wrapped the already-wrapped
		// handler on every render and nested it deeper each time.
		const { isSubmitSuccessful } = form.formState;
		useEffect(() => {
			if (options.clearOnSubmit && isSubmitSuccessful) {
				localStorage.removeItem(`form_${formKey}`);
			}
		}, [isSubmitSuccessful, formKey, options.clearOnSubmit]);

		return <WrappedComponent {...props} />;
	};
}
