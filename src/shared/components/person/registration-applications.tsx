import { Component, linkEvent } from "inferno";
import {
  ApproveRegistrationApplication,
  GetSiteResponse,
  ListRegistrationApplications,
  ListRegistrationApplicationsResponse,
  RegistrationApplicationView,
} from "lemmy-js-client";
import { i18n } from "../../i18next";
import { InitialFetchRequest } from "../../interfaces";
import { UserService } from "../../services";
import {
  HttpService,
  RequestState,
  apiWrapper,
  apiWrapperIso,
} from "../../services/HttpService";
import {
  editRegistrationApplications,
  fetchLimit,
  isBrowser,
  isInitialRoute,
  myAuthRequired,
  setIsoData,
  setupTippy,
  toast,
} from "../../utils";
import { HtmlTags } from "../common/html-tags";
import { Spinner } from "../common/icon";
import { Paginator } from "../common/paginator";
import { RegistrationApplication } from "../common/registration-application";

enum UnreadOrAll {
  Unread,
  All,
}

interface RegistrationApplicationsState {
  appsRes: RequestState<ListRegistrationApplicationsResponse>;
  siteRes: GetSiteResponse;
  unreadOrAll: UnreadOrAll;
  page: number;
}

export class RegistrationApplications extends Component<
  any,
  RegistrationApplicationsState
> {
  private isoData = setIsoData(this.context);
  state: RegistrationApplicationsState = {
    appsRes: { state: "empty" },
    siteRes: this.isoData.site_res,
    unreadOrAll: UnreadOrAll.Unread,
    page: 1,
  };

  constructor(props: any, context: any) {
    super(props, context);

    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleApproveApplication = this.handleApproveApplication.bind(this);

    if (!UserService.Instance.myUserInfo && isBrowser()) {
      toast(i18n.t("not_logged_in"), "danger");
      this.context.router.history.push(`/login`);
    }

    // Only fetch the data if coming from another route
    if (isInitialRoute(this.isoData, this.context)) {
      this.state = {
        ...this.state,
        appsRes: apiWrapperIso(
          this.isoData.routeData[0] as ListRegistrationApplicationsResponse
        ),
      };
    }
  }

  async componentDidMount() {
    if (!isInitialRoute(this.isoData, this.context)) {
      await this.refetch();
    }
    setupTippy();
  }

  get documentTitle(): string {
    let mui = UserService.Instance.myUserInfo;
    return mui
      ? `@${mui.local_user_view.person.name} ${i18n.t(
          "registration_applications"
        )} - ${this.state.siteRes.site_view.site.name}`
      : "";
  }

  renderApps() {
    switch (this.state.appsRes.state) {
      case "loading":
        return (
          <h5>
            <Spinner large />
          </h5>
        );
      case "success": {
        const apps = this.state.appsRes.data.registration_applications;
        return (
          <div className="row">
            <div className="col-12">
              <HtmlTags
                title={this.documentTitle}
                path={this.context.router.route.match.url}
              />
              <h5 className="mb-2">{i18n.t("registration_applications")}</h5>
              {this.selects()}
              {this.applicationList(apps)}
              <Paginator
                page={this.state.page}
                onChange={this.handlePageChange}
              />
            </div>
          </div>
        );
      }
    }
  }

  render() {
    return <div className="container-lg">{this.renderApps()}</div>;
  }

  unreadOrAllRadios() {
    return (
      <div className="btn-group btn-group-toggle flex-wrap mb-2">
        <label
          className={`btn btn-outline-secondary pointer
            ${this.state.unreadOrAll == UnreadOrAll.Unread && "active"}
          `}
        >
          <input
            type="radio"
            value={UnreadOrAll.Unread}
            checked={this.state.unreadOrAll == UnreadOrAll.Unread}
            onChange={linkEvent(this, this.handleUnreadOrAllChange)}
          />
          {i18n.t("unread")}
        </label>
        <label
          className={`btn btn-outline-secondary pointer
            ${this.state.unreadOrAll == UnreadOrAll.All && "active"}
          `}
        >
          <input
            type="radio"
            value={UnreadOrAll.All}
            checked={this.state.unreadOrAll == UnreadOrAll.All}
            onChange={linkEvent(this, this.handleUnreadOrAllChange)}
          />
          {i18n.t("all")}
        </label>
      </div>
    );
  }

  selects() {
    return (
      <div className="mb-2">
        <span className="mr-3">{this.unreadOrAllRadios()}</span>
      </div>
    );
  }

  applicationList(apps: RegistrationApplicationView[]) {
    return (
      <div>
        {apps.map(ra => (
          <>
            <hr />
            <RegistrationApplication
              key={ra.registration_application.id}
              application={ra}
              onApproveApplication={this.handleApproveApplication}
            />
          </>
        ))}
      </div>
    );
  }

  handleUnreadOrAllChange(i: RegistrationApplications, event: any) {
    i.setState({ unreadOrAll: Number(event.target.value), page: 1 });
    i.refetch();
  }

  handlePageChange(page: number) {
    this.setState({ page });
    this.refetch();
  }

  static fetchInitialData(req: InitialFetchRequest): Promise<any>[] {
    let promises: Promise<any>[] = [];

    let auth = req.auth;
    if (auth) {
      let form: ListRegistrationApplications = {
        unread_only: true,
        page: 1,
        limit: fetchLimit,
        auth,
      };
      promises.push(req.client.listRegistrationApplications(form));
    }

    return promises;
  }

  async refetch() {
    let unread_only = this.state.unreadOrAll == UnreadOrAll.Unread;
    this.setState({
      appsRes: { state: "loading" },
    });
    this.setState({
      appsRes: await apiWrapper(
        HttpService.client.listRegistrationApplications({
          unread_only: unread_only,
          page: this.state.page,
          limit: fetchLimit,
          auth: myAuthRequired(),
        })
      ),
    });
  }

  async handleApproveApplication(form: ApproveRegistrationApplication) {
    const approveRes = await apiWrapper(
      HttpService.client.approveRegistrationApplication(form)
    );

    this.setState(s => {
      if (s.appsRes.state == "success" && approveRes.state == "success") {
        s.appsRes.data.registration_applications = editRegistrationApplications(
          approveRes.data.registration_application,
          s.appsRes.data.registration_applications
        );
      }
      return s;
    });
  }
}
