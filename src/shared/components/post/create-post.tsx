import { Component } from "inferno";
import { RouteComponentProps } from "inferno-router/dist/Route";
import {
  CreatePost as CreatePostI,
  GetCommunity,
  GetCommunityResponse,
  GetSiteResponse,
} from "lemmy-js-client";
import { InitialFetchRequest, PostFormParams } from "shared/interfaces";
import { i18n } from "../../i18next";
<<<<<<< HEAD
import { UserService } from "../../services";
import { HttpService, apiWrapper } from "../../services/HttpService";
||||||| 0bd9a17
import { UserService, WebSocketService } from "../../services";
=======
import { WebSocketService } from "../../services";
>>>>>>> main
import {
  Choice,
  QueryParams,
  enableDownvotes,
  enableNsfw,
  getIdFromString,
  getQueryParams,
<<<<<<< HEAD
  getQueryString,
  isInitialRoute,
||||||| 0bd9a17
  getQueryString,
  isBrowser,
=======
  isBrowser,
>>>>>>> main
  myAuth,
  setIsoData,
} from "../../utils";
import { HtmlTags } from "../common/html-tags";
import { Spinner } from "../common/icon";
import { PostForm } from "./post-form";

export interface CreatePostProps {
  communityId?: number;
}

function getCreatePostQueryParams() {
  return getQueryParams<CreatePostProps>({
    communityId: getIdFromString,
  });
}

interface CreatePostState {
  siteRes: GetSiteResponse;
  loading: boolean;
  selectedCommunityChoice?: Choice;
}

export class CreatePost extends Component<
  RouteComponentProps<Record<string, never>>,
  CreatePostState
> {
  private isoData = setIsoData(this.context);
  state: CreatePostState = {
    siteRes: this.isoData.site_res,
    loading: true,
  };

  constructor(props: RouteComponentProps<Record<string, never>>, context: any) {
    super(props, context);

    this.handlePostCreate = this.handlePostCreate.bind(this);
    this.handleSelectedCommunityChange =
      this.handleSelectedCommunityChange.bind(this);

    // Only fetch the data if coming from another route
    if (isInitialRoute(this.isoData, this.context)) {
      const communityRes = this.isoData.routeData[0] as
        | GetCommunityResponse
        | undefined;

      if (communityRes) {
        const communityChoice: Choice = {
          label: communityRes.community_view.community.title,
          value: communityRes.community_view.community.id.toString(),
        };

        this.state = {
          ...this.state,
          selectedCommunityChoice: communityChoice,
        };
      }

      this.state = {
        ...this.state,
        loading: false,
      };
    }
  }

  async fetchCommunity() {
    const { communityId } = getCreatePostQueryParams();
    const auth = myAuth();

    if (communityId) {
      const res = await apiWrapper(
        HttpService.client.getCommunity({
          id: communityId,
          auth,
        })
      );

      if (res.state == "success") {
        this.setState({
          selectedCommunityChoice: {
            label: res.data.community_view.community.name,
            value: res.data.community_view.community.id.toString(),
          },
          loading: false,
        });
      }
    }
  }

  async componentDidMount() {
    // TODO test this
    if (!isInitialRoute(this.isoData, this.context)) {
      const { communityId } = getCreatePostQueryParams();

      if (
        communityId?.toString() !== this.state.selectedCommunityChoice?.value
      ) {
        await this.fetchCommunity();
      } else if (!communityId) {
        this.setState({
          selectedCommunityChoice: undefined,
          loading: false,
        });
      }
    }
  }

  get documentTitle(): string {
    return `${i18n.t("create_post")} - ${
      this.state.siteRes.site_view.site.name
    }`;
  }

  render() {
    const { selectedCommunityChoice } = this.state;

    const locationState = this.props.history.location.state as
      | PostFormParams
      | undefined;

    return (
      <div className="container-lg">
        <HtmlTags
          title={this.documentTitle}
          path={this.context.router.route.match.url}
        />
        {this.state.loading ? (
          <h5>
            <Spinner large />
          </h5>
        ) : (
          <div className="row">
            <div className="col-12 col-lg-6 offset-lg-3 mb-4">
              <h5>{i18n.t("create_post")}</h5>
              <PostForm
                onCreate={this.handlePostCreate}
                params={locationState}
                enableDownvotes={enableDownvotes(this.state.siteRes)}
                enableNsfw={enableNsfw(this.state.siteRes)}
                allLanguages={this.state.siteRes.all_languages}
                siteLanguages={this.state.siteRes.discussion_languages}
                selectedCommunityChoice={selectedCommunityChoice}
                onSelectCommunity={this.handleSelectedCommunityChange}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  async updateUrl({ communityId }: Partial<CreatePostProps>) {
    const { communityId: urlCommunityId } = getCreatePostQueryParams();

    const locationState = this.props.history.location.state as
      | PostFormParams
      | undefined;

    const url = new URL(location.href);

    const newId = (communityId ?? urlCommunityId)?.toString();

    if (newId !== undefined) {
      url.searchParams.set("communityId", newId);
    } else {
      url.searchParams.delete("communityId");
    }

    history.replaceState(locationState, "", url);

    await this.fetchCommunity();
  }

  handleSelectedCommunityChange(choice: Choice) {
    this.updateUrl({
      communityId: getIdFromString(choice?.value),
    });
  }

  async handlePostCreate(form: CreatePostI) {
    const res = await apiWrapper(HttpService.client.createPost(form));
    if (res.state == "success") {
      const postId = res.data.post_view.post.id;
      this.props.history.replace(`/post/${postId}`);
    }
  }

  static fetchInitialData({
    client,
    query: { communityId },
    auth,
  }: InitialFetchRequest<QueryParams<CreatePostProps>>): Promise<any>[] {
    const promises: Promise<any>[] = [];

    if (communityId) {
      const form: GetCommunity = {
        auth,
        id: getIdFromString(communityId),
      };

      promises.push(client.getCommunity(form));
    } else {
      promises.push(Promise.resolve());
    }

    return promises;
  }
<<<<<<< HEAD
||||||| 0bd9a17

  parseMessage(msg: any) {
    const op = wsUserOp(msg);
    console.log(msg);
    if (msg.error) {
      toast(i18n.t(msg.error), "danger");
      return;
    }

    if (op === UserOperation.GetCommunity) {
      const {
        community_view: {
          community: { name, id },
        },
      } = wsJsonToRes<GetCommunityResponse>(msg);

      this.setState({
        selectedCommunityChoice: { label: name, value: id.toString() },
        loading: false,
      });
    }
  }
=======

  parseMessage(msg: any) {
    const op = wsUserOp(msg);
    console.log(msg);
    if (msg.error) {
      toast(i18n.t(msg.error), "danger");
      return;
    }

    if (op === UserOperation.GetCommunity) {
      const {
        community_view: {
          community: { title, id },
        },
      } = wsJsonToRes<GetCommunityResponse>(msg);

      this.setState({
        selectedCommunityChoice: { label: title, value: id.toString() },
        loading: false,
      });
    }
  }
>>>>>>> main
}
