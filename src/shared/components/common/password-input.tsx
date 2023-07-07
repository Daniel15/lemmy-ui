import { Options, passwordStrength } from "check-password-strength";
import classNames from "classnames";
import { NoOptionI18nKeys } from "i18next";
import { Component, FormEventHandler, linkEvent } from "inferno";
import { NavLink } from "inferno-router";
import { I18NextService } from "../../services";
import { Icon } from "./icon";

interface PasswordInputProps {
  id: string;
  value?: string;
  onInput: FormEventHandler<HTMLInputElement>;
  className?: string;
  showStrength?: boolean;
  cols?: number | null;
  label?: string;
  showForgotLink?: boolean;
}

interface PasswordInputState {
  show: boolean;
}

const passwordStrengthOptions: Options<string> = [
  {
    id: 0,
    value: "very_weak",
    minDiversity: 0,
    minLength: 0,
  },
  {
    id: 1,
    value: "weak",
    minDiversity: 2,
    minLength: 10,
  },
  {
    id: 2,
    value: "medium",
    minDiversity: 3,
    minLength: 12,
  },
  {
    id: 3,
    value: "strong",
    minDiversity: 4,
    minLength: 14,
  },
];

function handleToggleShow(i: PasswordInput) {
  i.setState(prev => ({
    ...prev,
    show: !prev.show,
  }));
}

class PasswordInput extends Component<PasswordInputProps, PasswordInputState> {
  state: PasswordInputState = {
    show: false,
  };

  constructor(props: PasswordInputProps, context: any) {
    super(props, context);
  }

  render() {
    const {
      props: {
        id,
        value,
        onInput,
        className,
        showStrength,
        cols = 10,
        label,
        showForgotLink,
      },
      state: { show },
    } = this;

    return (
      <>
        <div
          className={classNames(className, {
            row: !!cols,
          })}
        >
          {label && (
            <label
              className={`col-sm-${12 - (cols ?? 0)} col-form-label`}
              htmlFor={id}
            >
              {label}
            </label>
          )}
          <div
            className={classNames({
              [`col-sm-${cols}`]: !!cols,
            })}
          >
            <div className="input-group">
              <input
                type={show ? "text" : "password"}
                className="form-control"
                aria-describedby={id}
                autoComplete="on"
                onInput={onInput}
                value={value}
                required
                maxLength={60}
                minLength={showStrength ? 10 : 0}
              />
              <button
                className="btn btn-outline-dark"
                type="button"
                id={id}
                onClick={linkEvent(this, handleToggleShow)}
                aria-label={show ? "Hide Password" : "Show Password"}
                data-tippy-content={show ? "Hide Password" : "Show Password"}
              >
                <Icon icon={`eye${show ? "-slash" : ""}`} inline />
              </button>
            </div>
            {showForgotLink && (
              <NavLink
                className="btn p-0 btn-link d-inline-block float-right text-muted small font-weight-bold pointer-events not-allowed"
                to="/login_reset"
              >
                {I18NextService.i18n.t("forgot_password")}
              </NavLink>
            )}
          </div>
        </div>
        {showStrength && value && (
          <div className={this.passwordColorClass}>
            {I18NextService.i18n.t(this.passwordStrength as NoOptionI18nKeys)}
          </div>
        )}
      </>
    );
  }

  get passwordStrength(): string | undefined {
    const password = this.props.value;
    return password
      ? passwordStrength(password, passwordStrengthOptions).value
      : undefined;
  }

  get passwordColorClass(): string {
    const strength = this.passwordStrength;

    if (strength && ["weak", "medium"].includes(strength)) {
      return "text-warning";
    } else if (strength == "strong") {
      return "text-success";
    } else {
      return "text-danger";
    }
  }
}

export default PasswordInput;
