interface RheaTextProps {
  content: string;
  ariaLabel: string;
  semanticTag: string;
  lang: string;
  customId: string;
  customClass: string;
}

type JssSupportedProperty<T> = T | undefined;

export interface Props {
  /** A prop whose resolved type name is long enough to need truncating. */
  text: JssSupportedProperty<
    Pick<RheaTextProps, 'content' | 'ariaLabel' | 'semanticTag' | 'lang' | 'customId' | 'customClass'>
  >;
}

export function LongTypeName(props: Props) {
  return <span>{JSON.stringify(props.text)}</span>;
}
