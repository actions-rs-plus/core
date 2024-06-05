// import "@actions/github";
// import "@octokit/plugin-rest-endpoint-methods";

// vitest.mock("@octokit/plugin-rest-endpoint-methods", () => {
//     console.error("UH OH ");
//     return {
//         restEndpointMethods: () => {
//             // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
//             const fn = () => {
//                 return {
//                     data: {
//                         id: 5,
//                     },
//                 };
//             };

//             return {
//                 rest: {
//                     checks: {
//                         create: fn,
//                         update: fn,
//                     },
//                 },
//             };
//         },
//         legacyRestEndpointMethods: () => {},
//     };
// });
