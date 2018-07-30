const aws = require("@pulumi/aws");

const lambdaRole = new aws.iam.Role("mock-job-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "lambda.amazonaws.com"
        },
        Effect: "Allow",
        Sid: ""
      }
    ]
  })
});

const lambdaRolePolicy = new aws.iam.RolePolicy("mock-job-policy", {
  role: lambdaRole.id,
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource: "arn:aws:logs:*:*:*"
      },
      {
        Effect: "Allow",
        Action: ["codepipeline:*"],
        Resource: "*"
      }
    ]
  })
});

const pipelineFunction = new aws.serverless.Function(
  "mock-build-job",
  { role: lambdaRole },
  (event, context, callback) => {
    const AWS = require("aws-sdk");
    const codepipeline = new AWS.CodePipeline();
    const jobId = event["CodePipeline.job"].id;

    console.log("DEBUG - Received event:", JSON.stringify(event, null, 2));

    const putJobSuccess = message => {
      const params = {
        jobId: jobId
      };

      codepipeline.putJobSuccessResult(params, (err, data) => {
        if (err) {
          context.fail(err);
        } else {
          context.succeed(message);
        }
      });
    };

    putJobSuccess("Tests passed.");
  }
);

// Export the DNS name of the bucket
exports.functionArn = pipelineFunction.functionArn;
