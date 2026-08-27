import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

describe('parse — basic interface (fixture 01)', () => {
  it('extracts a plain Props interface', () => {
    const result = parse(fixture('01-basic-interface.tsx'));
    expect(result).toMatchSnapshot();
  });

  it('marks optional props as not required', () => {
    const result = parse(fixture('01-basic-interface.tsx'));
    expect(result.props.name.required).toBe(true);
    expect(result.props.count.required).toBe(false);
  });

  it('pulls jsdoc descriptions per prop', () => {
    const result = parse(fixture('01-basic-interface.tsx'));
    expect(result.props.name.description).toBe("The user's display name");
  });
});

describe('parse — jsdoc comments (fixture 02)', () => {
  it('extracts interface-level and per-prop descriptions plus @default', () => {
    const result = parse(fixture('02-jsdoc-comments.tsx'));
    expect(result).toMatchSnapshot();
  });

  it('reads the component-level description off the interface', () => {
    const result = parse(fixture('02-jsdoc-comments.tsx'));
    expect(result.description).toBe(
      'A button that triggers an action.\n\nSupports primary and secondary visual styles.'
    );
  });

  it('joins multi-line prop comments into one description', () => {
    const result = parse(fixture('02-jsdoc-comments.tsx'));
    expect(result.props.variant.description).toBe(
      'Visual style of the button.\nUse "primary" for the main call to action on a page.'
    );
  });

  it('reads @default as defaultValue, separate from description', () => {
    const result = parse(fixture('02-jsdoc-comments.tsx'));
    expect(result.props.variant.defaultValue).toEqual({ value: "'secondary'" });
  });

  it('leaves defaultValue unset when there is no @default tag', () => {
    const result = parse(fixture('02-jsdoc-comments.tsx'));
    expect(result.props.disabled.defaultValue).toBeUndefined();
    expect(result.props.label.defaultValue).toBeUndefined();
  });
});

describe('parse — extended interface (fixture 03)', () => {
  it('includes both own and inherited props', () => {
    const result = parse(fixture('03-extended-interface.tsx'));
    expect(result).toMatchSnapshot();
  });

  it('carries over jsdoc description from the base interface', () => {
    const result = parse(fixture('03-extended-interface.tsx'));
    expect(result.props.id.description).toBe('Unique identifier for the element.');
  });

  it('carries over optionality from the base interface', () => {
    const result = parse(fixture('03-extended-interface.tsx'));
    expect(result.props.className.required).toBe(false);
    expect(result.props.id.required).toBe(true);
  });

  it('keeps the description from the extending interface, not the base', () => {
    const result = parse(fixture('03-extended-interface.tsx'));
    expect(result.description).toBe('A card that displays a title and optional footer.');
  });
});

describe('parse — multi-level extends (fixture 04)', () => {
  it('flattens a three-level extends chain into one prop set', () => {
    const result = parse(fixture('04-multilevel-extends.tsx'));
    expect(result).toMatchSnapshot();
  });

  it('includes props from every level of the chain', () => {
    const result = parse(fixture('04-multilevel-extends.tsx'));
    expect(Object.keys(result.props).sort()).toEqual(['id', 'label', 'onClick']);
  });

  it('preserves each prop\'s own jsdoc regardless of which level it came from', () => {
    const result = parse(fixture('04-multilevel-extends.tsx'));
    expect(result.props.id.description).toBe('From the root of the chain.');
    expect(result.props.label.description).toBe('Middle of the chain.');
    expect(result.props.onClick.description).toBe('Own prop, not inherited.');
  });
});

describe('parse — union of primitives (fixture 05)', () => {
  it('renders a string literal union as a pipe-joined type name', () => {
    const result = parse(fixture('05-union-primitive.tsx'));
    expect(result).toMatchSnapshot();
  });

  it('renders a numeric literal union', () => {
    const result = parse(fixture('05-union-primitive.tsx'));
    expect(result.props.size.type.name).toBe('1 | 2 | 3');
    expect(result.props.size.required).toBe(false);
  });

  it('keeps a nullable-but-required prop required, with null in the type', () => {
    const result = parse(fixture('05-union-primitive.tsx'));
    expect(result.props.label.type.name).toBe('string | null');
    expect(result.props.label.required).toBe(true);
  });
});

describe('parse — discriminated union of objects (fixture 06)', () => {
  it('splits a union-of-objects prop into structured branches', () => {
    const result = parse(fixture('06-union-object-discriminated.tsx'));
    expect(result).toMatchSnapshot();
  });

  it('keeps the flattened union string as type.name for baseline display', () => {
    const result = parse(fixture('06-union-object-discriminated.tsx'));
    expect(result.props.action.type.name).toBe('LinkAction | ButtonAction');
  });

  it('produces one element per union branch, in declaration order', () => {
    const result = parse(fixture('06-union-object-discriminated.tsx'));
    expect(result.props.action.type.elements).toHaveLength(2);
  });

  it('detects the shared literal discriminant per branch', () => {
    const result = parse(fixture('06-union-object-discriminated.tsx'));
    const [linkBranch, buttonBranch] = result.props.action.type.elements!;
    expect(linkBranch.discriminant).toEqual({ name: 'type', value: '"link"' });
    expect(buttonBranch.discriminant).toEqual({ name: 'type', value: '"button"' });
  });

  it('resolves each branch\'s own props independently, including jsdoc', () => {
    const result = parse(fixture('06-union-object-discriminated.tsx'));
    const [linkBranch, buttonBranch] = result.props.action.type.elements!;
    expect(Object.keys(linkBranch.props).sort()).toEqual(['href', 'type']);
    expect(linkBranch.props.href.description).toBe('Destination URL.');
    expect(Object.keys(buttonBranch.props).sort()).toEqual(['onClick', 'type']);
    expect(buttonBranch.props.onClick.type.name).toBe('() => void');
  });

  it('does not attach elements to a plain (non-union-of-objects) prop', () => {
    const result = parse(fixture('06-union-object-discriminated.tsx'));
    expect(result.props.label.type.elements).toBeUndefined();
  });
});

describe('parse — non-discriminated union of objects (fixture 07)', () => {
  it('still splits into branches when there is no shared tag field', () => {
    const result = parse(fixture('07-union-object-non-discriminated.tsx'));
    expect(result).toMatchSnapshot();
  });

  it('produces one element per branch', () => {
    const result = parse(fixture('07-union-object-non-discriminated.tsx'));
    expect(result.props.lookup.type.elements).toHaveLength(2);
  });

  it('leaves discriminant unset on every branch, not just undefined-valued', () => {
    const result = parse(fixture('07-union-object-non-discriminated.tsx'));
    const [byEmail, byId] = result.props.lookup.type.elements!;
    expect('discriminant' in byEmail).toBe(false);
    expect('discriminant' in byId).toBe(false);
  });

  it('still resolves each branch\'s own props correctly', () => {
    const result = parse(fixture('07-union-object-non-discriminated.tsx'));
    const [byEmail, byId] = result.props.lookup.type.elements!;
    expect(Object.keys(byEmail.props)).toEqual(['email']);
    expect(Object.keys(byId.props)).toEqual(['id']);
  });
});

describe('parse — top-level union Props type (fixture 08)', () => {
  it('resolves the union type alias, not an unrelated same-file *Props interface', () => {
    const result = parse(fixture('08-top-level-union-props.tsx'));
    expect(result).toMatchSnapshot();
  });

  it('picks InputProps (the component\'s actual param type), not InputTextProps', () => {
    const result = parse(fixture('08-top-level-union-props.tsx'));
    expect(result.displayName).toBe('InputProps');
  });

  it('produces one element per branch with correct discriminant and full prop set', () => {
    const result = parse(fixture('08-top-level-union-props.tsx'));
    expect(result.elements).toHaveLength(2);
    const [textBranch, checkboxBranch] = result.elements!;
    expect(textBranch.discriminant).toEqual({ name: 'type', value: '"text"' });
    expect(Object.keys(textBranch.props).sort()).toEqual(['placeholder', 'type', 'value']);
    expect(checkboxBranch.discriminant).toEqual({ name: 'type', value: '"checkboxGroup"' });
    expect(Object.keys(checkboxBranch.props).sort()).toEqual(['options', 'type', 'values']);
  });

  it('keeps each branch\'s own jsdoc uncontaminated by other branches', () => {
    const result = parse(fixture('08-top-level-union-props.tsx'));
    const [textBranch, checkboxBranch] = result.elements!;
    expect(textBranch.props.type.description).toBe(
      'Discriminant identifying this as a plain text input.'
    );
    expect(checkboxBranch.props.type.description).toBe(
      'Discriminant identifying this as a checkbox group.'
    );
  });

  it('does not concatenate mismatched jsdoc into the flattened top-level props', () => {
    const result = parse(fixture('08-top-level-union-props.tsx'));
    // "type" is present in every branch but each branch's jsdoc differs,
    // so the flattened view must drop the description rather than
    // mash both branches' text together.
    expect(result.props.type.description).toBeUndefined();
  });

  it('unions every branch\'s fields into the flattened props, not just the shared discriminant', () => {
    const result = parse(fixture('08-top-level-union-props.tsx'));
    // Previously only "type" (the one field common to every branch) showed
    // up here — this is what actually feeds Storybook's Controls panel, so
    // every field from every branch needs to be visible, not just the
    // intersection TypeScript gives you natively.
    expect(Object.keys(result.props).sort()).toEqual([
      'options',
      'placeholder',
      'type',
      'value',
      'values',
    ]);
  });

  it('keeps a field\'s own description in the flattened props when it only appears in one branch', () => {
    const result = parse(fixture('08-top-level-union-props.tsx'));
    expect(result.props.value.description).toBe('The current text value.');
    expect(result.props.options.description).toBe('All selectable options for the group.');
  });

  it('marks a branch-specific field as not required in the flattened props', () => {
    const result = parse(fixture('08-top-level-union-props.tsx'));
    // "value" only exists on the text branch, so it can't be
    // unconditionally required at the top level.
    expect(result.props.value.required).toBe(false);
  });

  it('keeps the interface-level jsdoc as the top-level description', () => {
    const result = parse(fixture('08-top-level-union-props.tsx'));
    expect(result.description).toBe(
      'Props for the Input family of components — the concrete shape\ndepends on `type`.'
    );
  });
});

describe('parse — Pick<T, K> (fixture 09)', () => {
  it('includes only the picked keys, each keeping its own jsdoc', () => {
    const result = parse(fixture('09-pick.tsx'));
    expect(result).toMatchSnapshot();
    expect(Object.keys(result.props).sort()).toEqual(['id', 'name']);
    expect(result.props.id.description).toBe('Unique user id.');
  });
});

describe('parse — Omit<T, K> (fixture 10)', () => {
  it('excludes the omitted keys, keeping the rest with their jsdoc', () => {
    const result = parse(fixture('10-omit.tsx'));
    expect(result).toMatchSnapshot();
    expect(Object.keys(result.props).sort()).toEqual(['id', 'name']);
  });
});

describe('parse — Partial<T> (fixture 11)', () => {
  it('marks every prop optional and strips the implicit undefined from the type', () => {
    const result = parse(fixture('11-partial.tsx'));
    expect(result).toMatchSnapshot();
    expect(result.props.id.required).toBe(false);
    expect(result.props.name.required).toBe(false);
    // Regression: previously reported "string | undefined" here because
    // required detection (declaration questionToken) didn't know
    // Partial<T> had changed optionality, so the undefined-stripping
    // branch never ran.
    expect(result.props.id.type.name).toBe('string');
  });
});

describe('parse — Required<T> (fixture 12)', () => {
  it('marks every prop required, even one that was optional in the source interface', () => {
    const result = parse(fixture('12-required.tsx'));
    expect(result).toMatchSnapshot();
    // Regression: previously reported required: false here because
    // required detection read the original interface's `name?`
    // declaration instead of the checker's resolved (post-Required<T>)
    // optionality.
    expect(result.props.name.required).toBe(true);
    expect(result.props.id.required).toBe(true);
  });
});

describe('parse — Record<K, V> (fixture 13)', () => {
  it('produces one required prop per key of the union, all sharing the value type', () => {
    const result = parse(fixture('13-record.tsx'));
    expect(result).toMatchSnapshot();
    expect(Object.keys(result.props).sort()).toEqual(['large', 'medium', 'small']);
    expect(result.props.small.type.name).toBe('number');
    expect(result.props.small.required).toBe(true);
  });
});

describe('parse — nested object prop (fixture 14)', () => {
  it('keeps the reference type name and adds an expanded shape alongside it', () => {
    const result = parse(fixture('14-nested-object-prop.tsx'));
    expect(result).toMatchSnapshot();
    // Type identity is preserved, not replaced by the expansion.
    expect(result.props.user.type.name).toBe('AvatarUser');
  });

  it('expands the nested type\'s own fields with jsdoc intact', () => {
    const result = parse(fixture('14-nested-object-prop.tsx'));
    const nested = result.props.user.type.properties!;
    expect(Object.keys(nested).sort()).toEqual(['name', 'photoUrl']);
    expect(nested.name.description).toBe('Full display name.');
    expect(nested.photoUrl.required).toBe(false);
  });

  it('does not expand a plain primitive prop', () => {
    const result = parse(fixture('14-nested-object-prop.tsx'));
    expect(result.props.size.type.properties).toBeUndefined();
  });
});

describe('parse — nested object prop, two levels deep (fixture 15)', () => {
  it('expands an interface-inside-an-interface, not just the outer level', () => {
    const result = parse(fixture('15-double-nested-object-prop.tsx'));
    expect(result).toMatchSnapshot();

    const employer = result.props.user.type.properties!.employer;
    expect(employer.type.name).toBe('Employer');
    expect(employer.type.properties!.company.description).toBe('Company name.');
  });

  it('does not recurse forever on a self-referential type', () => {
    const result = parse(fixture('15-double-nested-object-prop.tsx'));
    const root = result.props.root.type.properties!;
    expect(root.label).toBeDefined();
    // "child" is TreeNode again — expanding it would recurse forever,
    // so it correctly stays unexpanded (bare type name only).
    expect(root.child.type.name).toBe('TreeNode');
    expect(root.child.type.properties).toBeUndefined();
  });
});

describe('parse — component signature resolution (fixtures 16-19)', () => {
  it('resolves the props type from destructured parameters, not the wrong same-file *Props', () => {
    const result = parse(fixture('16-destructured-props.tsx'));
    expect(result.displayName).toBe('Props');
    expect(Object.keys(result.props).sort()).toEqual(['label', 'onClick']);
  });

  it('resolves the props type from React.FC<Props> on the variable, not the parameter', () => {
    const result = parse(fixture('17-react-fc.tsx'));
    expect(result.displayName).toBe('Props');
    expect(Object.keys(result.props)).toEqual(['label']);
  });

  it('resolves the props type from forwardRef<Ref, Props>\'s second type argument', () => {
    const result = parse(fixture('18-forward-ref.tsx'));
    expect(result.displayName).toBe('Props');
    expect(Object.keys(result.props)).toEqual(['label']);
  });

  it('resolves the props type through a memo(...) wrapper', () => {
    const result = parse(fixture('19-memo.tsx'));
    expect(result.displayName).toBe('Props');
    expect(Object.keys(result.props)).toEqual(['label']);
  });
});

describe('parse — cross-file props type + intersection (fixture 21)', () => {
  it('resolves a props type declared in a separate types.ts, not this file', () => {
    const result = parse(fixture('21-cross-file-intersection/Card.tsx'));
    expect(result).toMatchSnapshot();
  });

  it('picks a clean display name from the intersection, not the full type string', () => {
    const result = parse(fixture('21-cross-file-intersection/Card.tsx'));
    expect(result.displayName).toBe('CardProps');
  });

  it('merges props from every constituent of the intersection', () => {
    const result = parse(fixture('21-cross-file-intersection/Card.tsx'));
    expect(Object.keys(result.props).sort()).toEqual([
      'customClass',
      'internalDebugId',
      'title',
    ]);
  });

  it('still follows a cross-file extends nested inside one intersection member', () => {
    const result = parse(fixture('21-cross-file-intersection/Card.tsx'));
    expect(result.props.customClass.description).toBe('Custom HTML class for the element.');
  });
});

describe('parse — respects the consuming project\'s tsconfig.json (fixture 20)', () => {
  it('resolves a path-aliased cross-file extends via baseUrl/paths from the real tsconfig', () => {
    const result = parse(fixture('20-tsconfig-project/src/components/Card.tsx'));
    expect(result).toMatchSnapshot();
    // Without reading the project's own tsconfig (baseUrl + paths for
    // "@base/*"), the import of BaseProps can't resolve at all, and
    // "id" silently disappears from the flattened extends chain —
    // confirmed by running the old hardcoded-options approach against
    // this same fixture, which reports only ["title"].
    expect(Object.keys(result.props).sort()).toEqual(['id', 'title']);
    expect(result.props.id.description).toBe(
      'Unique identifier, defined in a path-aliased base module.'
    );
  });
});
