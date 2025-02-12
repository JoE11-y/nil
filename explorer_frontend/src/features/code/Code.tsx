import { BUTTON_KIND, BUTTON_SIZE, Button, COLORS, Card, Spinner } from "@nilfoundation/ui-kit";
import { useUnit } from "effector-react";
import { $code, $error, changeCode, compile, compileCodeFx, fetchCodeSnippetFx } from "./model";
import "./init";
import { type Diagnostic, linter } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import { useStyletron } from "baseui";
import { expandProperty } from "inline-style-expand-shorthand";
import { memo, useMemo } from "react";
import { LayoutComponent, setActiveComponent } from "../../pages/playground/model";
import { fetchSolidityCompiler } from "../../services/compiler";
import { getMobileStyles } from "../../styleHelpers";
import { useMobile } from "../shared";
import { SolidityCodeField } from "../shared/components/SolidityCodeField";
import { CodeToolbar } from "./code-toolbar/CodeToolbar";
import { useCompileButton } from "./hooks/useCompileButton";

const MemoizedCodeToolbar = memo(CodeToolbar);

export const Code = () => {
  const [isMobile] = useMobile();
  const [code, isDownloading, errors, fetchingCodeSnippet, compiling] = useUnit([
    $code,
    fetchSolidityCompiler.pending,
    $error,
    fetchCodeSnippetFx.pending,
    compileCodeFx.pending,
  ]);
  const [css] = useStyletron();

  const codemirrorExtensions = useMemo(() => {
    const solidityLinter = (view: EditorView) => {
      const diagnostics: Diagnostic[] = errors.map((error) => {
        return {
          from: view.state.doc.line(error.line).from,
          to: view.state.doc.line(error.line).to,
          message: error.message,
          severity: "error",
        };
      });
      return diagnostics;
    };

    return [linter(solidityLinter)];
  }, [errors]);

  const noCode = code.trim().length === 0;
  const btnContent = useCompileButton();

  return (
    <Card
      overrides={{
        Root: {
          style: {
            backgroundColor: "transparent",
            width: "100%",
            maxWidth: "none",
            ...expandProperty("padding", "0"),
            height: "100%",
            ...getMobileStyles({
              width: "calc(100vw - 32px)",
              height: "calc(100vh - 96px)",
            }),
          },
        },
        Body: {
          style: {
            display: "flex",
            flexDirection: "column",
            position: "relative",
            height: "100%",
            marginBottom: 0,
            paddinBottom: "16px",
            ...getMobileStyles({
              gap: "8px",
            }),
          },
        },
        Contents: {
          style: {
            height: "100%",
          },
        },
      }}
    >
      <div
        className={css({
          flexBasis: "100%",
          height: "100%",
        })}
      >
        <div
          className={css({
            display: "flex",
            justifyContent: "flex-start",
            gap: "8px",
            paddingBottom: "8px",
            ...getMobileStyles({
              flexDirection: "column",
              gap: "8px",
            }),
            zIndex: 2,
            height: "auto",
          })}
        >
          <MemoizedCodeToolbar disabled={isDownloading} />
          {!isMobile && (
            <Button
              kind={BUTTON_KIND.primary}
              isLoading={isDownloading || compiling}
              size={BUTTON_SIZE.default}
              onClick={() => compile()}
              disabled={noCode}
              overrides={{
                Root: {
                  style: {
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                    marginLeft: "auto",
                  },
                },
              }}
              data-testid="compile-button"
            >
              {btnContent}
            </Button>
          )}
        </div>
        {fetchingCodeSnippet ? (
          <div
            className={css({
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
              backgroundColor: COLORS.gray900,
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
              borderBottomLeftRadius: "12px",
              borderBottomRightRadius: "12px",
            })}
          >
            <Spinner />
          </div>
        ) : (
          <div
            className={css({
              width: "100%",
              height: `calc(100% - ${isMobile ? "32px - 8px - 8px - 48px - 8px - 48px - 8px" : "48px - 8px"})`,
              overflow: "auto",
              overscrollBehavior: "contain",
              backgroundColor: COLORS.gray900,
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
              borderBottomLeftRadius: "12px",
              borderBottomRightRadius: "12px",
            })}
          >
            <SolidityCodeField
              extensions={codemirrorExtensions}
              editable
              readOnly={false}
              code={code}
              onChange={(text) => {
                changeCode(`${text}`);
              }}
              className={css({
                paddingBottom: "0!important",
              })}
              data-testid="code-field"
            />
          </div>
        )}
        {isMobile && (
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "48px 48px",
              gap: "8px",
              paddingTop: "8px",
            })}
          >
            <Button
              kind={BUTTON_KIND.primary}
              isLoading={isDownloading || compiling}
              onClick={() => compile()}
              disabled={noCode}
              overrides={{
                Root: {
                  style: {
                    lineHeight: 1,
                    gridColumn: "1 / 3",
                  },
                },
              }}
              data-testid="compile-button"
            >
              {btnContent}
            </Button>
            <Button
              overrides={{
                Root: {
                  style: {
                    gridColumn: "1 / 2",
                  },
                },
              }}
              kind={BUTTON_KIND.secondary}
              size={BUTTON_SIZE.large}
              onClick={() => setActiveComponent(LayoutComponent.Logs)}
            >
              Logs
            </Button>
            <Button
              overrides={{
                Root: {
                  style: {
                    gridColumn: "2 / 3",
                  },
                },
              }}
              kind={BUTTON_KIND.secondary}
              size={BUTTON_SIZE.large}
              onClick={() => setActiveComponent(LayoutComponent.Contracts)}
            >
              Contracts
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
