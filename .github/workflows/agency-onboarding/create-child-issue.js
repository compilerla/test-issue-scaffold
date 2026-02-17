const fs = require("fs");
const path = require("path");

module.exports = async ({
  github,
  context,
  core,
  parentIssueNumber,
  templateName,
  title,
}) => {
  const { long_name, short_name, transit_processor, website } =
    context.payload.inputs;

  // read and Process Template
  const templatePath = path.join(
    process.env.GITHUB_WORKSPACE,
    `.github/workflows/agency-onboarding/${templateName}`,
  );

  let body = fs.readFileSync(templatePath, "utf8");

  // replace all placeholders
  body = body
    .replace(/{{LONG_NAME}}/g, long_name)
    .replace(/{{SHORT_NAME}}/g, short_name)
    .replace(/{{TRANSIT_PROCESSOR}}/g, transit_processor)
    .replace(/{{WEBSITE}}/g, website || "N/A");

  // create the child issue
  const child = await github.rest.issues.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title: title,
    labels: ["agency-onboarding"],
    body: body,
  });

  // link as sub-issue
  try {
    await github.request("POST /repos/{owner}/{repo}/issues/{id}/sub_issue", {
      owner: context.repo.owner,
      repo: context.repo.repo,
      id: parentIssueNumber,
      sub_issue_id: child.data.id,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    console.log(
      `Linked issue #${child.data.number} as child of #${parentIssueNumber}`,
    );
  } catch (error) {
    core.warning(`Failed to link sub-issue: ${error.message}`);
  }

  return child.data.number;
};
