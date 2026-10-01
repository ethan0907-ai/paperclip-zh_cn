import { useTranslation } from "@/i18n";
import { copyTextToClipboard } from "@/lib/clipboard";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GITHUB_REVIEW_EVENTS,
  type GitHubChatConfiguration,
  type GitHubReviewPolicy,
  type GitHubAllowedPerson,
} from "@paperclipai/shared";
import { accessApi } from "@/api/access";
import { chatEndpointsApi } from "@/api/chatEndpoints";
import { githubChatApi } from "@/api/githubChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Link } from "@/lib/router";

export const githubSelectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const eventLabels = {
  opened: "appsGithubConfig.newPullRequest",
  synchronize: "appsGithubConfig.updatedCommits",
  reopened: "appsGithubConfig.reopened",
  ready_for_review: "appsGithubConfig.readyForReview",
  mention: "appsGithubConfig.mention",
  comment: "appsGithubConfig.followUpComment",
};
export function GitHubToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <ToggleSwitch
        aria-label={label}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}
export function GitHubPolicyEditor({
  policy,
  onChange,
}: {
  policy: GitHubReviewPolicy;
  onChange: (policy: GitHubReviewPolicy) => void;
}) {
  const { t } = useTranslation();
  const [prompt, setPrompt] =
    useState<(typeof GITHUB_REVIEW_EVENTS)[number]>("opened");
  const set = <K extends keyof GitHubReviewPolicy>(
    key: K,
    value: GitHubReviewPolicy[K],
  ) => onChange({ ...policy, [key]: value });
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="github-invocation">
          {t("appsGithubConfig.whenShouldThisAgentReview")}
        </Label>
        <select
          id="github-invocation"
          className={githubSelectClass}
          value={policy.invocation}
          onChange={(e) =>
            set(
              "invocation",
              e.target.value as GitHubReviewPolicy["invocation"],
            )
          }
        >
          <option value="linked_authors">
            {t("appsGithubConfig.linkedMembersPRsAndAuthorizedMentions")}
          </option>
          <option value="mentions_only">{t("appsGithubConfig.authorizedMentionsOnly")}</option>
          <option value="allowed_authors">
            {t("appsGithubConfig.allowedAuthorsPRsAndAuthorizedMentions")}
          </option>
        </select>
        <p className="text-xs text-muted-foreground">
          {t("appsGithubConfig.newlyAddedPeopleHaveASeparateAutomaticReviewSetting")}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-medium">{t("appsGithubConfig.automaticReviewEvents")}</h3>
        {GITHUB_REVIEW_EVENTS.slice(0, 4).map((event) => (
          <GitHubToggle
            key={event}
            label={t(eventLabels[event])}
            checked={policy.events.includes(event)}
            onChange={(enabled) =>
              set(
                "events",
                enabled
                  ? [...new Set([...policy.events, event])]
                  : policy.events.filter((value) => value !== event),
              )
            }
          />
        ))}
        <GitHubToggle
          label={t("appsGithubConfig.includeDraftPRs")}
          checked={policy.reviewDrafts}
          onChange={(value) => set("reviewDrafts", value)}
        />
        <GitHubToggle
          label={t("appsGithubConfig.includeBotAuthors")}
          description={t("appsGithubConfig.alsoAllowTheBotAccountInAccessWithA")}
          checked={policy.reviewBotAuthors}
          onChange={(value) => set("reviewBotAuthors", value)}
        />
      </div>
      <details className="rounded-lg border border-border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          {t("appsGithubConfig.authorBranchLabelAndFileFilters")}
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              [
                "includeAuthors",
                t("appsGithubConfig.includedAuthors"),
                t("appsGithubConfig.leaveEmptyToIncludeAnyAuthorizedAuthorOneUsername"),
              ],
              [
                "excludeAuthors",
                t("appsGithubConfig.excludedAuthors"),
                t("appsGithubConfig.oneUsernameOrGlobPerLine"),
              ],
              [
                "targetBranches",
                t("appsGithubConfig.targetBranches"),
                t("appsGithubConfig.leaveEmptyForAllBranchesSupportsAnd"),
              ],
              [
                "excludedBranches",
                t("appsGithubConfig.excludedTargetBranches"),
                t("appsGithubConfig.neverAutomaticallyReviewTheseBranchesSupportsAnd"),
              ],
              [
                "requiredLabels",
                t("appsGithubConfig.requiredLabels"),
                t("appsGithubConfig.allListedLabelsMustBePresent"),
              ],
              [
                "excludedLabels",
                t("appsGithubConfig.excludedLabels"),
                t("appsGithubConfig.anyListedLabelPreventsAutomaticReview"),
              ],
              [
                "ignoredPaths",
                t("appsGithubConfig.ignoredFilePaths"),
                t("appsGithubConfig.excludedFromManualAndAutomaticAnalysisSupportsAnd"),
              ],
            ] as const
          ).map(([key, label, help]) => (
            <div className="space-y-2" key={key}>
              <Label htmlFor={`github-${key}`}>{label}</Label>
              <Textarea
                id={`github-${key}`}
                value={policy[key].join("\n")}
                onChange={(e) =>
                  set(key, e.target.value.split("\n").filter(Boolean))
                }
              />
              <p className="text-xs text-muted-foreground">{help}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("appsGithubConfig.authorizedManualRequestsBypassAutomaticSchedulingFiltersRepositoryRestrictions")}
        </p>
      </details>
      <div className="space-y-2">
        <Label htmlFor="github-instructions">{t("appsGithubConfig.reviewInstructions")}</Label>
        <Textarea
          id="github-instructions"
          value={policy.instructions}
          onChange={(e) => set("instructions", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t("appsGithubConfig.additionalGuidanceForTheAssignedAgentProviderContentCannot")}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="github-prompt-event">{t("appsGithubConfig.eventPrompts")}</Label>
        <select
          id="github-prompt-event"
          className={githubSelectClass}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value as typeof prompt)}
        >
          {GITHUB_REVIEW_EVENTS.map((event) => (
            <option key={event} value={event}>
              {t(eventLabels[event])}
            </option>
          ))}
        </select>
        <Textarea
          aria-label={t("appsGithubConfig.eventPrompt", { event: t(eventLabels[prompt]) })}
          value={policy.prompts[prompt]}
          onChange={(e) =>
            set("prompts", { ...policy.prompts, [prompt]: e.target.value })
          }
        />
        <p className="text-xs text-muted-foreground">
          {t("appsGithubConfig.paperclipSuppliesRepositoryPRBaseAndHeadCommitsSender")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="github-categories">{t("appsGithubConfig.findingCategories")}</Label>
          <Input
            id="github-categories"
            value={policy.findingCategories.join(", ")}
            onChange={(e) =>
              set(
                "findingCategories",
                e.target.value
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean),
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            {t("appsGithubConfig.commaSeparatedAssessmentCategories")}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="github-severity">
            {t("appsGithubConfig.minimumInlineCommentSeverity")}
          </Label>
          <select
            id="github-severity"
            className={githubSelectClass}
            value={policy.minimumCommentSeverity}
            onChange={(e) =>
              set(
                "minimumCommentSeverity",
                e.target.value as GitHubReviewPolicy["minimumCommentSeverity"],
              )
            }
          >
            <option value="info">{t("appsGithubConfig.info")}</option>
            <option value="warning">{t("appsGithubConfig.warning")}</option>
            <option value="error">{t("appsGithubConfig.error")}</option>
          </select>
          <p className="text-xs text-muted-foreground">
            {t("appsGithubConfig.hiddenCommentsStillCountInTheAssessment")}
          </p>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium">{t("appsGithubConfig.publicationPermissions")}</h3>
        <GitHubToggle
          label={t("appsGithubConfig.publishSummary")}
          checked={policy.publishSummary}
          onChange={(value) => set("publishSummary", value)}
        />
        <GitHubToggle
          label={t("appsGithubConfig.publishInlineFindings")}
          checked={policy.publishInline}
          onChange={(value) => set("publishInline", value)}
        />
        <GitHubToggle
          label={t("appsGithubConfig.allowFormalApprovals")}
          description={t("appsGithubConfig.aSeparateAgentActionA55ScoreNever")}
          checked={policy.allowApprove}
          onChange={(value) => set("allowApprove", value)}
        />
        <GitHubToggle
          label={t("appsGithubConfig.allowFormalRequestChanges")}
          checked={policy.allowRequestChanges}
          onChange={(value) => set("allowRequestChanges", value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="github-rating">{t("appsGithubConfig.paperclipReviewCheck")}</Label>
        <select
          id="github-rating"
          className={githubSelectClass}
          value={policy.ratingThreshold ?? "report"}
          onChange={(e) =>
            set(
              "ratingThreshold",
              e.target.value === "report"
                ? null
                : (Number(e.target.value) as 1 | 2 | 3 | 4 | 5),
            )
          }
        >
          {[5, 4, 3, 2, 1].map((score) => (
            <option key={score} value={score}>
              {t("appsGithubConfig.minimumRating", { score })}
            </option>
          ))}
          <option value="report">{t("appsGithubConfig.reportOnly")}</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {t("appsGithubConfig.paperclipComputesTheResultForTheExactReviewedCommit")}
        </p>
        <a
          className="text-xs underline"
          href="https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository"
          target="_blank"
          rel="noreferrer"
        >
          {t("appsGithubConfig.setUpARequiredCheckOnGitHub")}
        </a>
      </div>
    </div>
  );
}

export function GitHubAccessEditor({
  endpointId,
  companyId,
  configuration,
  onChange,
}: {
  endpointId: string;
  companyId: string;
  configuration: GitHubChatConfiguration;
  onChange: (configuration: GitHubChatConfiguration) => void;
}) {
  const { t } = useTranslation();
  const accountLink = useRef<HTMLAnchorElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const members = useQuery({
    queryKey: ["github-members", companyId],
    queryFn: () => accessApi.listMembers(companyId),
  });
  const links = useQuery({
    queryKey: ["github-linked-members", endpointId],
    queryFn: () => chatEndpointsApi.listPrincipals(endpointId),
  });
  const [kind, setKind] = useState<"member" | "guest" | null>(null);
  const [login, setLogin] = useState("");
  const [sponsor, setSponsor] = useState(configuration.responsibleUserId);
  const [candidate, setCandidate] = useState<{
    githubUserId: string;
    login: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const add = (person: GitHubAllowedPerson) => {
    if (
      configuration.people.some((p) => p.githubUserId === person.githubUserId)
    )
      return;
    onChange({
      ...configuration,
      ...(person.kind === "member" ? { memberAccess: "selected" } : {}),
      people: [...configuration.people, person],
    });
    setKind(null);
    setCandidate(null);
    setLogin("");
  };
  const activeMembers = (members.data?.members ?? []).filter(
    (member) =>
      member.status === "active" && member.membershipRole !== "viewer",
  );
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="github-responsible">
          {t("appsGithubConfig.responsibleUserForAutomaticEvents")}
        </Label>
        <select
          id="github-responsible"
          className={githubSelectClass}
          value={configuration.responsibleUserId}
          onChange={(e) =>
            onChange({ ...configuration, responsibleUserId: e.target.value })
          }
        >
          {activeMembers.map((member) => (
            <option key={member.principalId} value={member.principalId}>
              {member.user?.name ?? member.user?.email ?? member.principalId}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {t("appsGithubConfig.accountableForAutomaticTasksThePRAuthorAndWebhook")}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="github-member-access">{t("appsGithubConfig.companyMemberAccess")}</Label>
        <select
          id="github-member-access"
          className={githubSelectClass}
          value={configuration.memberAccess}
          onChange={(e) =>
            onChange({
              ...configuration,
              memberAccess: e.target.value as "all_linked" | "selected",
            })
          }
        >
          <option value="all_linked">{t("appsGithubConfig.allLinkedCompanyMembers")}</option>
          <option value="selected">{t("appsGithubConfig.onlySelectedLinkedMembers")}</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {t("appsGithubConfig.membersConnectTheirOwnGitHubAccount")}{" "}
          <Link
            className="underline"
            ref={accountLink}
            to={`/apps/chat/connect?provider=github&resume=${endpointId}&stage=identity`}
          >
            {t("appsGithubConfig.openAccountLinking")}
          </Link>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              if (accountLink.current)
                void copyTextToClipboard(accountLink.current.href).then(
                  () => setLinkCopied(true),
                  () =>
                    setError(
                      t("appsGithubConfig.couldNotCopyTheLinkOpenAccountLinkingAnd"),
                    ),
                );
            }}
          >
            {linkCopied ? t("appsGithubConfig.linkCopied") : t("appsGithubConfig.copyLinkForTeammates")}
          </Button>
          .
        </p>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t("appsGithubConfig.linkedGitHubAccounts")}</h3>
        {links.isError && (
          <p role="alert" className="text-sm text-destructive">
            {t("appsGithubConfig.couldNotLoadLinkedAccounts")}
          </p>
        )}
        {(links.data ?? [])
          .filter((link) => link.status === "linked")
          .map((link) => (
            <div
              key={link.principalId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <p className="text-sm">
                @{link.githubLogin ?? link.externalLabel}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await chatEndpointsApi.revokeLink(
                      endpointId,
                      link.principalId,
                    );
                    await links.refetch();
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : t("appsGithubConfig.couldNotUnlinkThisAccount"),
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("appsGithubConfig.unlinkAccount")}
              </Button>
            </div>
          ))}
        {!links.isPending &&
          !links.isError &&
          !(links.data ?? []).some((link) => link.status === "linked") && (
            <p className="text-sm text-muted-foreground">
              {t("appsGithubConfig.noAccountsLinkedYetEachTeammateConfirmsTheirOwn")}
            </p>
          )}
      </div>
      <div className="divide-y divide-border rounded-lg border border-border">
        {configuration.people.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            {t("appsGithubConfig.noIndividualAccessEntriesUnlinkedPeopleCannotInvokeThis")}
          </p>
        )}
        {configuration.people.map((person) => (
          <div key={person.githubUserId} className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">@{person.login}</p>
                <p className="text-xs text-muted-foreground">
                  {person.kind === "member"
                    ? t("appsGithubConfig.linkedCompanyMember")
                    : t("appsGithubConfig.externalContributorRestrictedGuestPermissions")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({
                    ...configuration,
                    people: configuration.people.filter(
                      (p) => p.githubUserId !== person.githubUserId,
                    ),
                  })
                }
              >
                {t("appsGithubConfig.remove")}
              </Button>
            </div>
            <GitHubToggle
              label={t("appsGithubConfig.automaticReviewsForUser", { login: person.login })}
              checked={person.automaticReviews}
              onChange={(value) =>
                onChange({
                  ...configuration,
                  people: configuration.people.map((p) =>
                    p.githubUserId === person.githubUserId
                      ? { ...p, automaticReviews: value }
                      : p,
                  ),
                })
              }
            />
            {person.kind === "guest" && (
              <p className="text-xs text-muted-foreground">
                {t("appsGithubConfig.sponsor")}{" "}
                {activeMembers.find(
                  (member) => member.principalId === person.sponsorUserId,
                )?.user?.name ?? person.sponsorUserId}
                {t("appsGithubConfig.noCompanyMembershipOrPersonalCredentialsAreGranted")}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setKind("member")}>
          {t("appsGithubConfig.addLinkedMember")}
        </Button>
        <Button variant="outline" onClick={() => setKind("guest")}>
          {t("appsGithubConfig.allowExternalContributor")}
        </Button>
      </div>
      {kind === "member" && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-sm">
            {t("appsGithubConfig.addingAMemberSwitchesAccessToTheSelectedMember")}
          </p>
          {(links.data ?? [])
            .filter((link) => link.status === "linked" && link.paperclipUserId)
            .map((link) => (
              <Button
                className="mr-2"
                key={link.id}
                variant="outline"
                disabled={configuration.people.some(
                  (p) =>
                    p.kind === "member" && p.userId === link.paperclipUserId,
                )}
                onClick={() => {
                  const id = link.githubUserId;
                  if (!id) {
                    setError(
                      t("appsGithubConfig.refreshLinkedIdentitiesBeforeAddingThisMember"),
                    );
                    return;
                  }
                  add({
                    kind: "member",
                    userId: link.paperclipUserId!,
                    githubUserId: id,
                    login: link.githubLogin ?? link.externalLabel,
                    automaticReviews: false,
                  });
                }}
              >
                {link.paperclipUserLabel ?? link.externalLabel}
              </Button>
            ))}
          <Button variant="ghost" onClick={() => setKind(null)}>
            {t("appsGithubConfig.cancel")}
          </Button>
        </div>
      )}
      {kind === "guest" && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <p className="text-sm">
            {t("appsGithubConfig.allowOneGitHubAccountToMentionTheBotWith")}
          </p>
          <div className="space-y-2">
            <Label htmlFor="github-guest-login">{t("appsGithubConfig.gitHubUsername")}</Label>
            <div className="flex gap-2">
              <Input
                id="github-guest-login"
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value);
                  setCandidate(null);
                }}
              />
              <Button
                variant="outline"
                disabled={busy || !login}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    setCandidate(await githubChatApi.lookup(endpointId, login));
                  } catch (error) {
                    setError(
                      error instanceof Error ? error.message : t("appsGithubConfig.lookupFailed"),
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("appsGithubConfig.lookUp")}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="github-guest-sponsor">{t("appsGithubConfig.sponsorLabel")}</Label>
            <select
              id="github-guest-sponsor"
              className={githubSelectClass}
              value={sponsor}
              onChange={(e) => setSponsor(e.target.value)}
            >
              {activeMembers.map((member) => (
                <option key={member.principalId} value={member.principalId}>
                  {member.user?.name ?? member.principalId}
                </option>
              ))}
            </select>
          </div>
          {candidate && (
            <p className="text-sm">
              @{candidate.login} · {t("appsGithubConfig.githubId", { id: candidate.githubUserId })}
            </p>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setKind(null)}>
              {t("appsGithubConfig.cancel")}
            </Button>
            <Button
              disabled={
                !candidate ||
                !sponsor ||
                configuration.people.some(
                  (p) => p.githubUserId === candidate.githubUserId,
                )
              }
              onClick={() =>
                candidate &&
                add({
                  ...candidate,
                  kind: "guest",
                  sponsorUserId: sponsor,
                  permissionProfile: "restricted",
                  automaticReviews: false,
                })
              }
            >
              {t("appsGithubConfig.allowThisAccount")}
            </Button>
          </div>
        </div>
      )}
      {(error || members.error || links.error) && (
        <p role="alert" className="text-sm text-destructive">
          {error ||
            t("appsGithubConfig.couldNotLoadMembersOrLinkedAccountsRefreshTo")}
        </p>
      )}
    </div>
  );
}
