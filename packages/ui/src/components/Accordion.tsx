import {
  Disclosure as AriaDisclosure,
  type DisclosureProps as AriaDisclosureProps,
  DisclosureGroup as AriaDisclosureGroup,
  type DisclosureGroupProps as AriaDisclosureGroupProps,
  DisclosurePanel,
  Button,
  Heading,
} from "react-aria-components";
import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export interface AccordionProps extends Omit<AriaDisclosureGroupProps, "className"> {
  className?: string;
}

/**
 * An accordion (React Aria `DisclosureGroup`). By default multiple items can be
 * open; pass `allowsMultipleExpanded={false}` for one-at-a-time behavior.
 */
export function Accordion({ className, ...props }: AccordionProps) {
  return <AriaDisclosureGroup className={cx("kf-accordion", className)} {...props} />;
}

export interface AccordionItemProps extends Omit<AriaDisclosureProps, "className" | "children"> {
  /** The always-visible header label. */
  title: ReactNode;
  /** The collapsible content. */
  children: ReactNode;
  className?: string;
}

/** One expandable section inside an {@link Accordion}. */
export function AccordionItem({ title, children, className, ...props }: AccordionItemProps) {
  return (
    <AriaDisclosure className={cx("kf-accordion__item", className)} {...props}>
      <Heading className="kf-accordion__heading">
        <Button slot="trigger" className="kf-accordion__trigger">
          <span className="kf-accordion__title">{title}</span>
          <span aria-hidden="true" className="kf-accordion__icon">▸</span>
        </Button>
      </Heading>
      <DisclosurePanel className="kf-accordion__panel">
        <div className="kf-accordion__content">{children}</div>
      </DisclosurePanel>
    </AriaDisclosure>
  );
}
