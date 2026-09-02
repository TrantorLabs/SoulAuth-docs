#!/usr/bin/env python3
"""把 SoulAuth 的 Machine Contract 注册表同步进文档站。

# 为什么是「同步一份快照」而不是构建时去读源仓库

文档站要能独立构建。让它在构建时依赖另一个仓库存在于某个相对路径，
等于把「站点能不能出」绑在别人的目录结构上 —— GitHub Pages 的构建环境里
那个目录不存在，本地贡献者也未必把两个仓库放成兄弟目录。

所以这里落一份**派生快照**，并把来源 commit 一起记下来。数据是派生的这件事
不隐瞒：每个 Reference 页面都会显示它渲染的是哪个 commit 的契约。

# 为什么是 Python

文档站的运行时依赖只有 vitepress 一个，我不想为了一个偶尔跑一次的维护脚本
往里加 YAML 解析器 —— 那会进每一次 `npm ci`。构建只读已提交的 JSON，
零额外依赖；只有改动契约的人才需要 python3 + pyyaml。

# 用法

    python3 scripts/sync-contracts.py [SoulAuth 仓库路径]

默认找 ../SoulAuth。
"""

import json
import pathlib
import subprocess
import sys

try:
    import yaml
except ImportError:
    sys.exit("需要 pyyaml：pip install pyyaml")

REGISTRIES = ["openapi", "permissions", "configuration", "standards"]


def main() -> int:
    here = pathlib.Path(__file__).resolve().parent.parent
    src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else here.parent / "SoulAuth")
    contracts = src / "contracts"
    if not contracts.is_dir():
        return err(f"找不到 {contracts} —— 传入 SoulAuth 仓库路径作为第一个参数")

    out = here / "docs" / ".vitepress" / "data" / "contracts"
    out.mkdir(parents=True, exist_ok=True)

    for name in REGISTRIES:
        f = contracts / f"{name}.yaml"
        if not f.is_file():
            return err(f"缺少 {f}")
        try:
            data = yaml.safe_load(f.read_text())
        except yaml.YAMLError as e:
            return err(f"{f} 不是合法 YAML：{e}")
        (out / f"{name}.json").write_text(
            json.dumps(data, ensure_ascii=False, indent=2, sort_keys=False) + "\n"
        )
        print(f"  ✓ {name}.yaml → {name}.json")

    # 来源 commit。**必须记录** —— 没有它，读者无从判断这份渲染出来的
    # 契约对应的是哪一版代码，而「看起来很精确的过时数据」比没有数据更糟。
    commit = git(src, "rev-parse", "HEAD")
    dirty = bool(git(src, "status", "--porcelain"))
    (out / "SOURCE.json").write_text(
        json.dumps(
            {
                "repo": "SoulAuth",
                "commit": commit,
                "short": commit[:7],
                "branch": git(src, "rev-parse", "--abbrev-ref", "HEAD"),
                "committedAt": git(src, "log", "-1", "--format=%cI"),
                # 源仓库有未提交改动时，这份快照对应的东西在 git 里找不到。
                "dirty": dirty,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )
    print(f"  ✓ SOURCE.json  {commit[:7]}{'  ⚠ 源仓库有未提交改动' if dirty else ''}")
    return 0


def git(repo: pathlib.Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), *args], capture_output=True, text=True
    ).stdout.strip()


def err(msg: str) -> int:
    print(f"✗ {msg}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
