interface Item {
  /**
    * JSDOC for title property
  *
    * @default 'title'
    */
  title: string;
  /**
    * JSDOC for description property
  *
    * @default bbb
    */
  description: string
}


type FirstAction = {
  /**
    * Type of the first action
    */
  type: 'first-action';
  /**
    * Unique property for the first action
    */
  href: string;
};

type SecondAction = {
  /**
    * The of the second action
    */
  type: 'second-action';
  /**
    * Unique property for the second action
    */
  onClick: () => void;
};

/**
 * Function definition — a call signature declared via `interface`,
 * rather than a function type expression.
 */
interface Formatter {
  (value: number): string;
}

/**
 * Named function type — a function type expression given its own alias.
 */
type ClickHandler = (event: MouseEvent) => void;

interface SelectionEvent {
  x: number;
  y: number;
}

interface FirstInterface { title: string }

interface SecondInterface {
  // Limitation: Unable to see structure of FirstInterface
  item: FirstInterface
}

interface ThirdInterface {
  // Limitation: Unable to see structure of SecondInterface
  item: SecondInterface
}


interface NestedInterface {
  item: ThirdInterface

}

export interface ActionItemProps {
  /** Label displayed for the action item. */
  label: string;

  /** Number of items associated with this action item. */
  itemCount: number;

  /** A single item. */
  item: Item;

  /** List of items. */
  items: Item[];

  /** A single item described by an inline (anonymous) object shape. */
  anonymousItem: {
    title: string;
    description: string
  }

  /** List of items described by an inline (anonymous) object shape. */
  anonymousItems: { title: string; description: string }[]

  /** Union type of primitives */
  primitiveUnions: 'string' | number | boolean;

  /** Union type of anonymous interfaces */
  unionAnonymousInterfaces: { title: string } | { description: string }

  /** Either navigates somewhere or runs a handler, never both. */
  unionInterfaces: FirstAction | SecondAction;

  /** Deeply nested interface used to test nested type resolution. */
  nestedInterfaces: NestedInterface;

  /** Pick Utility Type */
  pickUtility: Pick<FirstAction, 'type'>;


  /** Omit Utility Type */
  omitUtility: Omit<FirstAction, 'type'>;

  /** Partial Utility Type */
  partialUtility: Partial<FirstAction>;

  /** Required Utility Type */
  requiredUtility: Required<FirstAction>;

  /** Function definition — typed via an `interface` call signature. */
  formatter: Formatter;

  /** Named function type — a function type expression given its own alias. */
  onClick: ClickHandler;

  /** Anonymous (inline) function type, written directly on the prop. */
  onHover: (event: MouseEvent) => void;

  /** Function whose single argument is an interface. */
  onSelect: (event: SelectionEvent) => void;

}

export function SimpleComponent(props: ActionItemProps) {
  return <span>{props.label}</span>;
}
