/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig(enableTailwind);

/**
 * Cache webpack sur disque DÉSACTIVÉ (équivaut à --bundle-cache=false).
 * Avec Node 24 + webpack 5.105, le cache filesystem se corrompt entre deux
 * renders : le 1er render après purge passe, le suivant crashe au re-hachage
 * du snapshot ("Cannot read properties of undefined (reading 'length')"
 * dans wasm-hash.js, appelé depuis FileSystemInfo).
 * NB : passer par overrideWebpackConfig ne marche PAS — dans
 * @remotion/bundler/dist/webpack-config.js, `cache` est réappliqué APRÈS
 * l'override utilisateur. setCachingEnabled est le seul levier réel.
 * Coût : ~30 s de bundling en plus par render.
 */
Config.setCachingEnabled(false);
