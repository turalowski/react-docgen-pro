import { SimpleComponent, type ActionItemProps } from './SimpleComponent';

export interface ExtraUserProps {
  /** Visual variant chosen by the consumer rendering this component. */
  variant: 'primary' | 'secondary';

  /** Optional callback the consumer provides for the action. */
  onAction?: () => void;
}

/**
 * Unlike `withExtraProps`, the extra props here are never computed by the
 * HOC itself — they're passed straight through from whoever renders the
 * wrapped component, the same way any other prop would be.
 */
export function withUserSuppliedProps(
  WrappedComponent: React.ComponentType<ActionItemProps & ExtraUserProps>
) {
  return function WithUserSuppliedProps(props: ActionItemProps & ExtraUserProps) {
    return <WrappedComponent {...props} />;
  };
}

function SimpleComponentWithExtraProps(props: ActionItemProps & ExtraUserProps) {
  return (
    <div data-variant={props.variant} onClick={props.onAction}>
      <SimpleComponent {...props} />
    </div>
  );
}

export const ComponentWithUserSuppliedProps = withUserSuppliedProps(SimpleComponentWithExtraProps);
