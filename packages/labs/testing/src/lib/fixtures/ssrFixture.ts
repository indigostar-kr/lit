/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {executeServerCommand} from '@web/test-runner-commands';
import {hydrateShadowRoots} from '@webcomponents/template-shadowroot';
import {litSsrPluginCommand} from '../constants.js';

import type {LitElement, TemplateResult} from 'lit';
import type {FixtureOption, SsrFixtureOption} from './fixtureOption.js';
import type {Payload} from '../litSsrPlugin.js';

// Enhance DOMParser's parseFromString method to include `includeShadowRoots`
// option for browsers that support declarative shadow DOM as proposed in
// https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md#mitigation.
declare global {
  interface DOMParser {
    parseFromString(
      string: string,
      type: DOMParserSupportedType,
      option: {includeShadowRoots: boolean}
    ): Document;
  }
}

/**
 * Renders the provided lit-html template with a Lit element server-side by
 * executing a custom command for Web Test Runner provided by the Lit SSR
 * Plugin, loads it to the document and (optionally) hydrates it, returning the
 * element.
 *
 * This module **must** be imported before any custom element definitions.
 *
 * @param {TemplateResult} template - lit-html template. Must contain a single
 * top level custom element.
 * @param {string[]} option.modules - Path to custom element definition modules
 * needed to render template, relative to the project root.
 * @param {string} option.base - Base path for the module. Generally should be
 * `import.meta.url`.
 * @param {boolean} [option.hydrate] - Defaults to true. Hydrates the component
 * after being loaded to the document.
 */
export async function ssrFixture(
  template: TemplateResult,
  {modules, base, hydrate = true}: SsrFixtureOption
): Promise<Element | null | undefined> {
  const rendered = await executeServerCommand<string, Payload>(
    litSsrPluginCommand,
    {
      template,
      modules: modules.map((module) => new URL(module, base).pathname),
    }
  );
  // TODO(augustinekim) Clean up the container from the document
  const container = document.createElement('div');
  document.body.appendChild(container);

  if (HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot')) {
    // Browser natively supports declarative shadowroot but must use DOMParser
    const fragment = new DOMParser().parseFromString(rendered, 'text/html', {
      includeShadowRoots: true,
    });
    container.replaceChildren(...Array.from(fragment.body.childNodes));
  } else {
    // Utilize ponyfill
    container.innerHTML = rendered;
    hydrateShadowRoots(container);
  }

  const el = container.firstElementChild as LitElement;
  if (hydrate) {
    // TODO(augustinekim) Consider handling cases where el is not a LitElement
    el.removeAttribute('defer-hydration');
    await el.updateComplete;
  }
  return el;
}

/**
 * Renders the provided lit-html template with a Lit element server-side by
 * executing a custom command for Web Test Runner provided by the Lit SSR
 * Plugin, loads it to the document and hydrates it, returning the element.
 *
 * This module **must** be imported before any custom element definitions.
 *
 * @param {TemplateResult} template - lit-html template. Must contain a single
 * top level custom element.
 * @param {string[]} option.modules - Path to custom element definition modules
 * needed to render template, relative to the project root.
 * @param {string} option.base - Base path for the module. Generally should be
 * `import.meta.url`.
 */
export async function ssrHydratedFixture(
  template: TemplateResult,
  {modules, base}: FixtureOption
) {
  return ssrFixture(template, {modules, base, hydrate: true});
}

/**
 * Renders the provided lit-html template with a Lit element server-side by
 * executing a custom command for Web Test Runner provided by the Lit SSR
 * Plugin, loads it to the document **without** hydrating it, returning the
 * element.
 *
 * This module **must** be imported before any custom element definitions.
 *
 * @param {TemplateResult} template - lit-html template. Must contain a single
 * top level custom element.
 * @param {string[]} option.modules - Path to custom element definition modules
 * needed to render template, relative to the project root.
 * @param {string} option.base - Base path for the module. Generally should be
 * `import.meta.url`.
 */
export async function ssrNonHydratedFixture(
  template: TemplateResult,
  {modules, base}: FixtureOption
) {
  return ssrFixture(template, {modules, base, hydrate: false});
}
