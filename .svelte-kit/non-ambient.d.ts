
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/auth" | "/api/cron" | "/api/cron/update-yield-sources" | "/api/v1" | "/api/v1/protected" | "/api/v1/protected/dapps" | "/api/v1/protected/historical" | "/api/v1/protected/yield-sources" | "/components" | "/dapps" | "/yield-sources" | "/yield-sources/[yieldSourceId]";
		RouteParams(): {
			"/yield-sources/[yieldSourceId]": { yieldSourceId: string }
		};
		LayoutParams(): {
			"/": { yieldSourceId?: string };
			"/api": Record<string, never>;
			"/api/auth": Record<string, never>;
			"/api/cron": Record<string, never>;
			"/api/cron/update-yield-sources": Record<string, never>;
			"/api/v1": Record<string, never>;
			"/api/v1/protected": Record<string, never>;
			"/api/v1/protected/dapps": Record<string, never>;
			"/api/v1/protected/historical": Record<string, never>;
			"/api/v1/protected/yield-sources": Record<string, never>;
			"/components": Record<string, never>;
			"/dapps": Record<string, never>;
			"/yield-sources": { yieldSourceId?: string };
			"/yield-sources/[yieldSourceId]": { yieldSourceId: string }
		};
		Pathname(): "/" | "/api" | "/api/auth" | "/api/cron" | "/api/cron/update-yield-sources" | "/api/v1" | "/api/v1/protected" | "/api/v1/protected/dapps" | "/api/v1/protected/historical" | "/api/v1/protected/yield-sources" | "/components" | "/dapps" | "/yield-sources" | `/yield-sources/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/hello-token-fav.svg" | "/logo.png" | "/no-image-circle-min.png" | "/no-image-square-min.png";
	}
}