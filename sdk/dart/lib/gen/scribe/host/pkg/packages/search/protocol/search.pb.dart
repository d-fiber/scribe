// This is a generated file - do not edit.
//
// Generated from scribe/host/pkg/packages/search/protocol/search.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class QueueRequest extends $pb.GeneratedMessage {
  factory QueueRequest({
    $core.String? index,
    $core.Iterable<$core.String>? ids,
  }) {
    final result = create();
    if (index != null) result.index = index;
    if (ids != null) result.ids.addAll(ids);
    return result;
  }

  QueueRequest._();

  factory QueueRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory QueueRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'QueueRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.search.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'index')
    ..pPS(2, _omitFieldNames ? '' : 'ids')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  QueueRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  QueueRequest copyWith(void Function(QueueRequest) updates) =>
      super.copyWith((message) => updates(message as QueueRequest))
          as QueueRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static QueueRequest create() => QueueRequest._();
  @$core.override
  QueueRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static QueueRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<QueueRequest>(create);
  static QueueRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get index => $_getSZ(0);
  @$pb.TagNumber(1)
  set index($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasIndex() => $_has(0);
  @$pb.TagNumber(1)
  void clearIndex() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get ids => $_getList(1);
}

class QueueResult extends $pb.GeneratedMessage {
  factory QueueResult({
    $core.bool? queued,
    $0.Failure? error,
  }) {
    final result = create();
    if (queued != null) result.queued = queued;
    if (error != null) result.error = error;
    return result;
  }

  QueueResult._();

  factory QueueResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory QueueResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'QueueResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.search.v1'),
      createEmptyInstance: create)
    ..aOB(1, _omitFieldNames ? '' : 'queued')
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  QueueResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  QueueResult copyWith(void Function(QueueResult) updates) =>
      super.copyWith((message) => updates(message as QueueResult))
          as QueueResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static QueueResult create() => QueueResult._();
  @$core.override
  QueueResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static QueueResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<QueueResult>(create);
  static QueueResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.bool get queued => $_getBF(0);
  @$pb.TagNumber(1)
  set queued($core.bool value) => $_setBool(0, value);
  @$pb.TagNumber(1)
  $core.bool hasQueued() => $_has(0);
  @$pb.TagNumber(1)
  void clearQueued() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class SearchRequest extends $pb.GeneratedMessage {
  factory SearchRequest({
    $core.String? index,
    $0.Json? params,
  }) {
    final result = create();
    if (index != null) result.index = index;
    if (params != null) result.params = params;
    return result;
  }

  SearchRequest._();

  factory SearchRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SearchRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SearchRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.search.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'index')
    ..aOM<$0.Json>(2, _omitFieldNames ? '' : 'params',
        subBuilder: $0.Json.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SearchRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SearchRequest copyWith(void Function(SearchRequest) updates) =>
      super.copyWith((message) => updates(message as SearchRequest))
          as SearchRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SearchRequest create() => SearchRequest._();
  @$core.override
  SearchRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SearchRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SearchRequest>(create);
  static SearchRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get index => $_getSZ(0);
  @$pb.TagNumber(1)
  set index($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasIndex() => $_has(0);
  @$pb.TagNumber(1)
  void clearIndex() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Json get params => $_getN(1);
  @$pb.TagNumber(2)
  set params($0.Json value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasParams() => $_has(1);
  @$pb.TagNumber(2)
  void clearParams() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Json ensureParams() => $_ensure(1);
}

class SearchResult extends $pb.GeneratedMessage {
  factory SearchResult({
    $0.Json? page,
    $0.Failure? error,
  }) {
    final result = create();
    if (page != null) result.page = page;
    if (error != null) result.error = error;
    return result;
  }

  SearchResult._();

  factory SearchResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SearchResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SearchResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.search.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Json>(1, _omitFieldNames ? '' : 'page', subBuilder: $0.Json.create)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SearchResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SearchResult copyWith(void Function(SearchResult) updates) =>
      super.copyWith((message) => updates(message as SearchResult))
          as SearchResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SearchResult create() => SearchResult._();
  @$core.override
  SearchResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SearchResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SearchResult>(create);
  static SearchResult? _defaultInstance;

  @$pb.TagNumber(1)
  $0.Json get page => $_getN(0);
  @$pb.TagNumber(1)
  set page($0.Json value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasPage() => $_has(0);
  @$pb.TagNumber(1)
  void clearPage() => $_clearField(1);
  @$pb.TagNumber(1)
  $0.Json ensurePage() => $_ensure(0);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class SearchApi {
  final $pb.RpcClient _client;

  SearchApi(this._client);

  $async.Future<QueueResult> add(
          $pb.ClientContext? ctx, QueueRequest request) =>
      _client.invoke<QueueResult>(ctx, 'Search', 'Add', request, QueueResult());
  $async.Future<QueueResult> delete(
          $pb.ClientContext? ctx, QueueRequest request) =>
      _client.invoke<QueueResult>(
          ctx, 'Search', 'Delete', request, QueueResult());
  $async.Future<SearchResult> search(
          $pb.ClientContext? ctx, SearchRequest request) =>
      _client.invoke<SearchResult>(
          ctx, 'Search', 'Search', request, SearchResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
