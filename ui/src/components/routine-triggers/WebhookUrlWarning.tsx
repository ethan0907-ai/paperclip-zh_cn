import { t, useTranslation } from "@/i18n";
import { InlineBanner } from "@/components/InlineBanner";
import { webhookUrlWarningReason } from "@/lib/webhook-url-warning";

const warnings = {
  loopback: {
    get title() { return t("routineTriggers.other_apps_can_t_reach_this_localhost_url"); },
    get message() { return t("routineTriggers.this_address_points_back_to_the_machine_sending_the_request_services_such_as_github_can_t_use_it_to_reach_paperclip_on_your_computer"); },
  },
  private: {
    get title() { return t("routineTriggers.this_webhook_url_appears_to_be_private"); },
    get message() { return t("routineTriggers.only_senders_with_access_to_this_network_can_reach_this_address_apps_on_the_public_internet_such_as_github_usually_can_t_deliver_webhooks_here"); },
  },
  tailscale: {
    get title() { return t("routineTriggers.this_tailscale_url_may_not_be_public"); },
    get message() { return t("routineTriggers.tailscale_serve_is_private_to_your_tailnet_even_with_https_apps_outside_your_tailnet_need_tailscale_funnel_or_another_public_https_address_if_funnel_is_already_enabled_for_this_url_you_can_continue"); },
  },
  https: {
    get title() { return t("routineTriggers.use_https_for_webhooks_from_other_apps"); },
    get message() { return t("routineTriggers.this_url_uses_http_many_apps_require_https_and_http_does_not_encrypt_webhook_credentials_or_payloads"); },
  },
  invalid: {
    get title() { return t("routineTriggers.check_the_webhook_url"); },
    get message() { return t("routineTriggers.this_is_not_a_valid_http_or_https_url_your_sending_app_needs_a_complete_address_it_can_reach"); },
  },
};

export function WebhookUrlWarning({ url }: { url: string }) {
  const { t } = useTranslation();
  const reason = webhookUrlWarningReason(url);
  if (!reason) return null;
  const warning = warnings[reason];
  return <InlineBanner tone="warning" title={warning.title}>
    <div className="space-y-2">
      <p>{warning.message}</p>
      <p>{t("routineTriggers.you_can_continue_for_local_or_private_network_use_for_public_senders_use_a_publicly_reachable_https_url")}</p>
      <a className="underline underline-offset-4" href="https://docs.paperclip.ing/reference/deploy/https/" target="_blank" rel="noopener noreferrer">{t("routineTriggers.learn_how_to_set_up_https_and_public_access")}</a>
    </div>
  </InlineBanner>;
}
