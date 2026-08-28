import React from 'react';

/**
 * The type parameter `T` isn't resolved against a concrete type when
 * this component is parsed in isolation, so `items`/`renderItem` show
 * up with an imprecise (generic) shape rather than the real element
 * type used at any particular call site.
 */
export interface GenericListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

export function GenericList<T>(props: GenericListProps<T>) {
  return (
    <ul>
      {props.items.map((item, i) => (
        <li key={i}>{props.renderItem(item)}</li>
      ))}
    </ul>
  );
}
