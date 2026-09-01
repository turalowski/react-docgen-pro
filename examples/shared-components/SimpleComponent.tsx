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


  /** Either navigates somewhere or runs a handler, never both. */
  action: FirstAction | SecondAction;

  /** Deeply nested interface used to test nested type resolution. */
  nestedInterfaces: NestedInterface;

  pickUtility: Pick<FirstAction, 'type'>;

  omitUtility: Omit<FirstAction, 'type'>;

  partialUtility: Partial<FirstAction>;

  requiredUtility: Required<FirstAction>;

}

export function SimpleComponent(props: ActionItemProps) {
  return <span>{props.label}</span>;
}
