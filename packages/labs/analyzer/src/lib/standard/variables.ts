/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with classes
 */

import ts from 'typescript';
import {VariableDeclaration} from '../model.js';
import {ProgramContext} from '../program-context.js';

export const getVariableDeclarations = (
  statement: ts.VariableStatement,
  programContext: ProgramContext
): VariableDeclaration[] => {
  return statement.declarationList.declarations
    .filter((dec) => ts.isIdentifier(dec.name))
    .map(
      (dec) =>
        new VariableDeclaration({
          name: (dec.name as ts.Identifier).text,
          node: dec,
          type: programContext.getTypeForNode(dec),
        })
    );
};
