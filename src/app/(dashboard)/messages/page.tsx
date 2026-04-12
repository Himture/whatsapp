"use client";

import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TextMessageForm } from "@/components/whatsapp/messages/text-message-form";
import { MediaMessageForm } from "@/components/whatsapp/messages/media-message-form";
import { TemplateMessageForm } from "@/components/whatsapp/messages/template-message-form";
import { InteractiveMessageForm } from "@/components/whatsapp/messages/interactive-message-form";
import { ContactMessageForm } from "@/components/whatsapp/messages/contact-message-form";
import { LocationMessageForm } from "@/components/whatsapp/messages/location-message-form";
import { ReactionForm } from "@/components/whatsapp/messages/reaction-form";
import { MarkReadForm } from "@/components/whatsapp/messages/mark-read-form";
import { ProductMessageForm } from "@/components/whatsapp/messages/product-message-form";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";

const MESSAGE_TABS = [
  { value: "text", label: "Text" },
  { value: "media", label: "Media" },
  { value: "template", label: "Template" },
  { value: "interactive", label: "Interactive" },
  { value: "contact", label: "Contact" },
  { value: "location", label: "Location" },
  { value: "reaction", label: "Reaction" },
  { value: "mark-read", label: "Mark Read" },
  { value: "products", label: "Products" },
] as const;

export default function MessagesPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-near-black">
          Messages
        </h1>
        <p className="mt-2 text-base text-warm-500">
          Send messages, reactions, and manage read receipts via the WhatsApp Cloud API.
        </p>
        <ApiDocLink />
      </div>

      <ConfigGuard>
        <Tabs defaultValue="text">
          <TabsList className="flex-wrap">
            {MESSAGE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="text">
            <TextMessageForm />
          </TabsContent>

          <TabsContent value="media">
            <MediaMessageForm />
          </TabsContent>

          <TabsContent value="template">
            <TemplateMessageForm />
          </TabsContent>

          <TabsContent value="interactive">
            <InteractiveMessageForm />
          </TabsContent>

          <TabsContent value="contact">
            <ContactMessageForm />
          </TabsContent>

          <TabsContent value="location">
            <LocationMessageForm />
          </TabsContent>

          <TabsContent value="reaction">
            <ReactionForm />
          </TabsContent>

          <TabsContent value="mark-read">
            <MarkReadForm />
          </TabsContent>

          <TabsContent value="products">
            <ProductMessageForm />
          </TabsContent>
        </Tabs>
      </ConfigGuard>
    </div>
  );
}
