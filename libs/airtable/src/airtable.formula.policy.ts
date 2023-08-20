import * as _ from 'lodash';

export class AirtableFormulaPolicy {
  mapJsonToFormula(where: Record<string, any>): string {
    if (Object.keys(where).length > 1) {
      return `AND(${_.chain(where)
        .mapValues((value, key) => `({${key}} = '${value}')`)
        .values()
        .join(', ')
        .value()})`;
    }
    return _.chain(where)
      .mapValues((value, key) => `({${key}} = '${value}')`)
      .values()
      .join(', ')
      .value();
  }

  mapJsonToFormulaV2(where: Record<string, any>): string {
    function processCondition(key: string, value: any): string {
      if (typeof value === 'object') {
        const subConditions = Object.entries(value).map(
          ([operator, operand]) => {
            if (operator === '$lte') {
              return `IS_BEFORE({${key}}, '${operand}')`;
            } else if (operator === '$gte') {
              return `IS_AFTER({${key}}, '${operand}')`;
            } else if (operator === '$or' && Array.isArray(operand)) {
              return `OR(${operand
                .map((val: string) => `{${key}} = '${val}'`)
                .join(', ')})`;
            } else if (operator === '$and' && Array.isArray(operand)) {
              return `AND(${operand
                .map((val: string) => `{${key}} = '${val}'`)
                .join(', ')})`;
            } else if (operator === '$ne') {
              return `NOT({${key}} = '${operand}')`;
            } else {
              return '';
            }
          },
        );
        return subConditions.filter((condition) => condition !== '').join(', ');
      } else {
        return `{${key}} = '${value}'`;
      }
    }

    const conditions = Object.entries(where).map(([key, value]) => {
      if (key === '$or') {
        return `OR(${Object.entries(value)
          .map(([subKey, subValue]) => {
            return processCondition(subKey, subValue);
          })
          .join(', ')})`;
      } else {
        return processCondition(key, value);
      }
    });

    if (
      Object.keys(where).length === 1 &&
      typeof Object.values(where)[0] === 'object'
    ) {
      return `AND(${conditions.join(', ')})`;
    }

    if (conditions.length > 1) {
      return `AND(${conditions.join(', ')})`;
    }

    return conditions.join(', ');
  }
}
