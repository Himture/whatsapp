import type { TemplateComponent, TemplateCreateInput } from "./whatsapp";
import type { TemplateCategory } from "./constants";

export interface TemplatePreset {
  id: string;
  label: string;
  description: string;
  category: TemplateCategory;
  useCase: string;
  input: TemplateCreateInput;
}

function text(component: "HEADER" | "BODY" | "FOOTER", body: string): TemplateComponent {
  if (component === "HEADER") return { type: "HEADER", format: "TEXT", text: body };
  if (component === "FOOTER") return { type: "FOOTER", text: body };
  return { type: "BODY", text: body };
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "order-confirmation",
    label: "Order confirmation",
    description: "Confirm an order with total and delivery window.",
    category: "UTILITY",
    useCase: "e-commerce",
    input: {
      name: "order_confirmation",
      language: "en",
      category: "UTILITY",
      components: [
        text("BODY", "Hi {{1}}, your order {{2}} has been confirmed. Total: {{3}}. Delivery by {{4}}."),
        text("FOOTER", "Reply STOP to opt out."),
      ],
    },
  },
  {
    id: "shipping-update",
    label: "Shipping update",
    description: "Notify shipping with tracking link.",
    category: "UTILITY",
    useCase: "logistics",
    input: {
      name: "shipping_update",
      language: "en",
      category: "UTILITY",
      components: [
        text("BODY", "{{1}}, your order {{2}} has shipped. Track here: {{3}}"),
      ],
    },
  },
  {
    id: "appointment-reminder",
    label: "Appointment reminder",
    description: "Remind a customer about an upcoming appointment.",
    category: "UTILITY",
    useCase: "services",
    input: {
      name: "appointment_reminder",
      language: "en",
      category: "UTILITY",
      components: [
        text("BODY", "Hi {{1}}, reminder: your appointment is on {{2}} at {{3}}. Reply to reschedule."),
      ],
    },
  },
  {
    id: "payment-receipt",
    label: "Payment receipt",
    description: "Send a payment confirmation.",
    category: "UTILITY",
    useCase: "finance",
    input: {
      name: "payment_receipt",
      language: "en",
      category: "UTILITY",
      components: [
        text("BODY", "Payment received: {{1}} for {{2}}. Reference: {{3}}. Thank you."),
      ],
    },
  },
  {
    id: "abandoned-cart",
    label: "Abandoned cart",
    description: "Recover shoppers who left items in their cart.",
    category: "MARKETING",
    useCase: "e-commerce",
    input: {
      name: "abandoned_cart",
      language: "en",
      category: "MARKETING",
      components: [
        text("BODY", "Hi {{1}}, you left {{2}} in your cart. Complete your order: {{3}}"),
        text("FOOTER", "Reply STOP to opt out."),
      ],
    },
  },
  {
    id: "welcome-message",
    label: "Welcome message",
    description: "Greet a new subscriber or customer.",
    category: "MARKETING",
    useCase: "onboarding",
    input: {
      name: "welcome_message",
      language: "en",
      category: "MARKETING",
      components: [
        text("HEADER", "Welcome to {{1}}!"),
        text("BODY", "Thanks for joining, {{2}}. Here's what you can do next: {{3}}"),
        text("FOOTER", "Reply STOP to opt out."),
      ],
    },
  },
  {
    id: "feedback-request",
    label: "Feedback request",
    description: "Ask for a review after a purchase or service.",
    category: "MARKETING",
    useCase: "customer-success",
    input: {
      name: "feedback_request",
      language: "en",
      category: "MARKETING",
      components: [
        text("BODY", "Hi {{1}}, how was your experience with {{2}}? Share feedback: {{3}}"),
        text("FOOTER", "Reply STOP to opt out."),
      ],
    },
  },
  {
    id: "re-engagement",
    label: "Re-engagement",
    description: "Bring back a customer who has been inactive.",
    category: "MARKETING",
    useCase: "retention",
    input: {
      name: "re_engagement",
      language: "en",
      category: "MARKETING",
      components: [
        text("BODY", "Hi {{1}}, we miss you. Here's a {{2}} offer just for you: {{3}}"),
        text("FOOTER", "Reply STOP to opt out."),
      ],
    },
  },
  {
    id: "otp-verification",
    label: "OTP verification",
    description: "Send a one-time verification code.",
    category: "AUTHENTICATION",
    useCase: "auth",
    input: {
      name: "otp_code",
      language: "en",
      category: "AUTHENTICATION",
      components: [
        text("BODY", "{{1}} is your verification code. Do not share it with anyone."),
      ],
    },
  },
  {
    id: "support-ticket-update",
    label: "Support ticket update",
    description: "Keep customers informed about their ticket status.",
    category: "UTILITY",
    useCase: "support",
    input: {
      name: "support_ticket_update",
      language: "en",
      category: "UTILITY",
      components: [
        text("BODY", "Ticket {{1}}: status updated to {{2}}. Latest note: {{3}}"),
      ],
    },
  },
];
