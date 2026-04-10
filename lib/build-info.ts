export function getBuildInfo() {
  return {
    sha: process.env.NEXT_PUBLIC_GIT_SHA ?? "local",
    builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? "dev",
  };
}
