
export interface Asset {
    uuid: AssetRef;
    type: "audio" | "video" | "image";
    /**
     * When this asset was last updated
     */
    lastModified: Date;
    /**
     * For example
     */
    extension: "jpg" | "png" | "mp3" | "mp4";

    /**
     * The local part of the URL. Should be fetchable by appending this to the cache or master server name.
     * @pattern ^(?!http[s]?|:|\/)(.+)[^:\/\s]+[\w\-\.]+[^#?\s]+.*?#[\w\-]+?$
     */
    path: string;

    /**
     * Cryptographic hash of the file. By default this is MD5, but @see hashAlgorithm for other options.
     */
    checksum: string;

    /**
     * Hash algorithm for the checksum. MD5 is fine for this, but we'll allow others for future-proofing.
     * @default "md5"
     */
    hashAlgorithm?: "md5" | "sha1" | "sha256" | "sha512";
}

export interface AssetList {
    assets: Asset[];
    lastModified: Date;
}
/**
 * UUID for asset
 *
 */
export type AssetRef = string;

export interface LocaleMap {
    en: Locale;
    [code: string]: Locale;
}

/**
 * The JSON object returned from the CMS
 */
export interface DVGData {
    locales: LocaleMap;
    tracks: Track[];
    routes: Route[];
    assets: AssetList;
    lastModified: string;
}

export interface Locale {
    /**
     * ISO 639-1 language code
     * @pattern ^[a-z]{2}$
     */
    code: string;
    /**
     * Local name
     */
    name: string;
    /**
     * The English name for the language
     */
    nameInEnglish: string;
    /**
     * Translated strings for UI elements
     * @minProperties 1
     */
    strings: LocaleStrings;
    /**
     * The DVG content
     */
    guideContent: Content;
}

export interface LocaleStrings { [tag: string]: string; }

export type AnySlice  = Route | Shop | Activity | Cafe;

export interface Content {
    welcome: Welcome;
    routes: Routes;
    /**
     * @minItems 1
     */
    cafes: Cafe[];
    /**
     * @minItems 1
     */
    shops: Shop[];
    planyourday: PlanYourDay;
    feedback: FeedbackQuestion[];
}

export interface Slice {
    /**
     * @minimum 0
     * @multipleOf 1
     */
    id: number;
    image: AssetRef;
    /**
     * Optimal length 20
     * @maxLength 45
     */
    title: string;
    enabled?: boolean;
    /**
     * @maxLength 360
     */
    description: string;

}

export interface Welcome {
    /**
     * @maxLength 40
     */
    title: string;
    /**
     * @maxLength 60
     */
    introduction: string;

    backgroundImage: AssetRef;
}

export interface RouteType {
    /**
     * @minimum 0
     * @multipleOf 1
     */
    id: number;
    /**
     * Used for the button. If empty, defaults to "Start tour".
     */
    label: string;
    /**
     * A longer description, displayed next to the button.
     * e.g. "Alternative route with no steps".
     * @maxLength 40
     */
    description: string;
}

export interface Routes {
    /**
     * @maxLength 18
     */
    title: string;
    /**
     * Key is language independent tag. Value is translated.
     * Optimal length 10. One item may be 15.
     */

    filterTags: { [key: string]: string };

    /**
     * Array of route ids
     * @minItems 1
     * @minimum 0
     * @multipleOf 1
     */
    routes: number[];
}

/**
 * @pattern ^[a-z\-]+$
 */
export type Tag = string;

export interface Route extends Slice {
    /**
     * @minimum 0
     * @multipleOf 1
     */
    id: number;

    /**
     * @maxLength 15
     */
    duration: string;
    accessible?: boolean;
    tags: Tag[];
    /**
     * @maxLength 140
     */
    description: string;

    trackLists: TrackList[];
}

export interface TrackList {
    /**
     * Array of track ids
     * @minItems 1
     * @minimum 0
     * @multipleOf 1
     */
    tracks: number[];
    routeType: RouteType;

    /**
     * The id of the suggested next tour.
     * Link will be to the route with the same type as this, or the default if not.
     * @minimum 0
     * @multipleOf 1
     */
    nextRoute: number;
}

export interface Track {
    /**
     * @minimum 0
     * @multipleOf 1
     */
    id: number;
    /**
     * Optimal length 23
     * @maxLength 50
     */
    title: string;
    /**
     * Optimal length 130. More will be hidden behind "Read more".
     * @maxLength 270
     */
    description?: string;

    file: AssetRef;
    /**
     * Duration in seconds
     */
    duration: number;

    previewImage: AssetRef;

    layeredContent?: LayeredContentList;
    slides?: Slide[];
}

export interface Slide {
    image: AssetRef;
    /**
     * Time in seconds when we'll start showing this.
     * @minimum 0
     * @multipleOf 1
     */
    timecode: number;
}

export type LayeredContentList = Array<LayeredMediaContent | LayeredReadContent>;

interface LayeredContent {
    /**
     * @minimum 0
     * @multipleOf 1
     */
    id: number;
    type: "read" | "listen" | "watch";
    /**
     * Optimal length 23 (one line)
     * @maxLength 50
     */
    title: string;
    /**
     * @maxLength 360
     */
    description: string;

    previewImage: AssetRef;
}

export interface LayeredReadContent extends LayeredContent {
    type: "read";
    /**
     * The enlarged image
     */
    zoomImage: AssetRef;
}

export interface LayeredMediaContent extends LayeredContent {
    type: "listen" | "watch";
    /**
     * The audio or video file
     */
    file: AssetRef;
}

export type AnyLayeredContent = LayeredReadContent | LayeredMediaContent;

export interface Retail extends Slice {
    openingTimes: string;
}

export interface Cafe extends Retail { }

export interface Shop extends Retail { }

export interface PlanYourDay {
    /**
     * @maxLength 18
     */
    title: string;

    /**
     * Key is language independent tag. Value is translated.
     */
    filterTags: { [key: string]: string };
    /**
     * @minItems 1
     */
    activities: Activity[];
}

export interface Activity extends Slice {

    /**
     * @maxLength 360
     */
    description: string;
    /**
     * Optional opening hours etc
     * @maxLength 15
     */
    hours?: string;
    /**
     * Cost, ticketing info
     * @maxLength 15
     */
    ticketing?: string;
    /**
     * Non-localised filter tags. Translations are in parent PlanYourDay object.
     */
    tags: Tag[];
}

export interface FeedbackQuestion {
    id: number;
    /**
     * @maxLength 100
     */
    question: string;

    /**
     * @maxLength 15
     */
    minLabel: string;
    /**
     * @maxLength 15
     */
    maxLabel: string;
}

export interface DVGDataConfig {
    cloudURL: string;
    cloudRoot: string;
    cacheURL?: string;

    cacheRoot?: string;
    cacheUpdateName?: string;
    cloudUpdateName?: string;
    autoUpdateFrom?: DownloadSource;
    sdCardDirectory?: string;
    slotStartTime?: string;
    slotLength: number;
    allowAutoUpdate?: boolean;

    environment: string;
}

export type DownloadSource = "cloud" | "cache";
