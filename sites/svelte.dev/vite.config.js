import { sveltekit } from '@sveltejs/kit/vite';
import { browserslistToTargets } from 'lightningcss';
import { readFile } from 'node:fs/promises';
import browserslist from 'browserslist';

/** @type {import('vite').PluginOption[]} */
const plugins = [raw(['.ttf']), sveltekit()];

// Only enable sharp if we're not in a webcontainer env
if (!process.versions.webcontainer) {
	const { imagetools } = await import('vite-imagetools');

	const plugin = imagetools({
		defaultDirectives: (url) => {
			if (url.searchParams.has('big-image')) {
				return new URLSearchParams('w=640;1280;2560;3840&format=avif;webp;png&as=picture');
			}

			return new URLSearchParams();
		}
	});

	plugins.push(/** @type {import('vite').PluginOption} */ (/** @type {unknown} */ (plugin)));
}

/**
 * @param {string[]} ext
 * @returns {import("vite").Plugin}
 */
function raw(ext) {
	return {
		name: 'vite-plugin-raw',
		async transform(_, id) {
			if (ext.some((e) => id.endsWith(e))) {
				const buffer = await readFile(id);
				return { code: `export default ${JSON.stringify(buffer)}`, map: null };
			}
		}
	};
}

/** @type {import('vite').UserConfig} */
const config = {
	logLevel: 'info',
	css: {
		transformer: 'lightningcss',
		lightningcss: {
			targets: browserslistToTargets(browserslist(['>0.2%', 'not dead']))
		}
	},
	build: {
		cssMinify: 'lightningcss'
	},
	plugins,
	optimizeDeps: {
		exclude: ['@sveltejs/site-kit', '@sveltejs/repl']
	},
	ssr: { noExternal: ['@sveltejs/site-kit', '@sveltejs/repl'] },
	server: {
		fs: {
			strict: false
		},
		port: 5177,
	}
};

export default config;
