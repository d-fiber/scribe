// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/searcher/protocol/searcher.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:fixnum/fixnum.dart' as $fixnum;
import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class Document extends $pb.GeneratedMessage {
  factory Document({
    $core.String? id,
    $0.Json? source,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (source != null) result.source = source;
    return result;
  }

  Document._();

  factory Document.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Document.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Document',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.searcher.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aOM<$0.Json>(2, _omitFieldNames ? '' : 'source',
        subBuilder: $0.Json.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Document clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Document copyWith(void Function(Document) updates) =>
      super.copyWith((message) => updates(message as Document)) as Document;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Document create() => Document._();
  @$core.override
  Document createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Document getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Document>(create);
  static Document? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Json get source => $_getN(1);
  @$pb.TagNumber(2)
  set source($0.Json value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasSource() => $_has(1);
  @$pb.TagNumber(2)
  void clearSource() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Json ensureSource() => $_ensure(1);
}

class AddRequest extends $pb.GeneratedMessage {
  factory AddRequest({
    $core.String? entity,
    $core.Iterable<Document>? documents,
    $core.bool? refresh,
  }) {
    final result = create();
    if (entity != null) result.entity = entity;
    if (documents != null) result.documents.addAll(documents);
    if (refresh != null) result.refresh = refresh;
    return result;
  }

  AddRequest._();

  factory AddRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory AddRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'AddRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.searcher.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'entity')
    ..pPM<Document>(2, _omitFieldNames ? '' : 'documents',
        subBuilder: Document.create)
    ..aOB(3, _omitFieldNames ? '' : 'refresh')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  AddRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  AddRequest copyWith(void Function(AddRequest) updates) =>
      super.copyWith((message) => updates(message as AddRequest)) as AddRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static AddRequest create() => AddRequest._();
  @$core.override
  AddRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static AddRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<AddRequest>(create);
  static AddRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get entity => $_getSZ(0);
  @$pb.TagNumber(1)
  set entity($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasEntity() => $_has(0);
  @$pb.TagNumber(1)
  void clearEntity() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<Document> get documents => $_getList(1);

  @$pb.TagNumber(3)
  $core.bool get refresh => $_getBF(2);
  @$pb.TagNumber(3)
  set refresh($core.bool value) => $_setBool(2, value);
  @$pb.TagNumber(3)
  $core.bool hasRefresh() => $_has(2);
  @$pb.TagNumber(3)
  void clearRefresh() => $_clearField(3);
}

class AddResult extends $pb.GeneratedMessage {
  factory AddResult({
    $core.int? indexed,
    $0.Failure? error,
  }) {
    final result = create();
    if (indexed != null) result.indexed = indexed;
    if (error != null) result.error = error;
    return result;
  }

  AddResult._();

  factory AddResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory AddResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'AddResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.searcher.v1'),
      createEmptyInstance: create)
    ..aI(1, _omitFieldNames ? '' : 'indexed', fieldType: $pb.PbFieldType.OU3)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  AddResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  AddResult copyWith(void Function(AddResult) updates) =>
      super.copyWith((message) => updates(message as AddResult)) as AddResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static AddResult create() => AddResult._();
  @$core.override
  AddResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static AddResult getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<AddResult>(create);
  static AddResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get indexed => $_getIZ(0);
  @$pb.TagNumber(1)
  set indexed($core.int value) => $_setUnsignedInt32(0, value);
  @$pb.TagNumber(1)
  $core.bool hasIndexed() => $_has(0);
  @$pb.TagNumber(1)
  void clearIndexed() => $_clearField(1);

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

class DeleteRequest extends $pb.GeneratedMessage {
  factory DeleteRequest({
    $core.String? entity,
    $core.Iterable<$core.String>? ids,
  }) {
    final result = create();
    if (entity != null) result.entity = entity;
    if (ids != null) result.ids.addAll(ids);
    return result;
  }

  DeleteRequest._();

  factory DeleteRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeleteRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeleteRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.searcher.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'entity')
    ..pPS(2, _omitFieldNames ? '' : 'ids')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteRequest copyWith(void Function(DeleteRequest) updates) =>
      super.copyWith((message) => updates(message as DeleteRequest))
          as DeleteRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeleteRequest create() => DeleteRequest._();
  @$core.override
  DeleteRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeleteRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeleteRequest>(create);
  static DeleteRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get entity => $_getSZ(0);
  @$pb.TagNumber(1)
  set entity($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasEntity() => $_has(0);
  @$pb.TagNumber(1)
  void clearEntity() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get ids => $_getList(1);
}

class DeleteResult extends $pb.GeneratedMessage {
  factory DeleteResult({
    $core.int? deleted,
    $0.Failure? error,
  }) {
    final result = create();
    if (deleted != null) result.deleted = deleted;
    if (error != null) result.error = error;
    return result;
  }

  DeleteResult._();

  factory DeleteResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeleteResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeleteResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.searcher.v1'),
      createEmptyInstance: create)
    ..aI(1, _omitFieldNames ? '' : 'deleted', fieldType: $pb.PbFieldType.OU3)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteResult copyWith(void Function(DeleteResult) updates) =>
      super.copyWith((message) => updates(message as DeleteResult))
          as DeleteResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeleteResult create() => DeleteResult._();
  @$core.override
  DeleteResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeleteResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeleteResult>(create);
  static DeleteResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get deleted => $_getIZ(0);
  @$pb.TagNumber(1)
  set deleted($core.int value) => $_setUnsignedInt32(0, value);
  @$pb.TagNumber(1)
  $core.bool hasDeleted() => $_has(0);
  @$pb.TagNumber(1)
  void clearDeleted() => $_clearField(1);

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

class GeoDistance extends $pb.GeneratedMessage {
  factory GeoDistance({
    $core.double? lat,
    $core.double? lng,
    $core.double? radiusMeters,
  }) {
    final result = create();
    if (lat != null) result.lat = lat;
    if (lng != null) result.lng = lng;
    if (radiusMeters != null) result.radiusMeters = radiusMeters;
    return result;
  }

  GeoDistance._();

  factory GeoDistance.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory GeoDistance.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'GeoDistance',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.searcher.v1'),
      createEmptyInstance: create)
    ..aD(1, _omitFieldNames ? '' : 'lat')
    ..aD(2, _omitFieldNames ? '' : 'lng')
    ..aD(3, _omitFieldNames ? '' : 'radiusMeters')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GeoDistance clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GeoDistance copyWith(void Function(GeoDistance) updates) =>
      super.copyWith((message) => updates(message as GeoDistance))
          as GeoDistance;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static GeoDistance create() => GeoDistance._();
  @$core.override
  GeoDistance createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static GeoDistance getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<GeoDistance>(create);
  static GeoDistance? _defaultInstance;

  @$pb.TagNumber(1)
  $core.double get lat => $_getN(0);
  @$pb.TagNumber(1)
  set lat($core.double value) => $_setDouble(0, value);
  @$pb.TagNumber(1)
  $core.bool hasLat() => $_has(0);
  @$pb.TagNumber(1)
  void clearLat() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.double get lng => $_getN(1);
  @$pb.TagNumber(2)
  set lng($core.double value) => $_setDouble(1, value);
  @$pb.TagNumber(2)
  $core.bool hasLng() => $_has(1);
  @$pb.TagNumber(2)
  void clearLng() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.double get radiusMeters => $_getN(2);
  @$pb.TagNumber(3)
  set radiusMeters($core.double value) => $_setDouble(2, value);
  @$pb.TagNumber(3)
  $core.bool hasRadiusMeters() => $_has(2);
  @$pb.TagNumber(3)
  void clearRadiusMeters() => $_clearField(3);
}

class Sort extends $pb.GeneratedMessage {
  factory Sort({
    $core.String? field_1,
    $core.bool? descending,
    GeoDistance? geo,
  }) {
    final result = create();
    if (field_1 != null) result.field_1 = field_1;
    if (descending != null) result.descending = descending;
    if (geo != null) result.geo = geo;
    return result;
  }

  Sort._();

  factory Sort.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Sort.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Sort',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.searcher.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'field')
    ..aOB(2, _omitFieldNames ? '' : 'descending')
    ..aOM<GeoDistance>(3, _omitFieldNames ? '' : 'geo',
        subBuilder: GeoDistance.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Sort clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Sort copyWith(void Function(Sort) updates) =>
      super.copyWith((message) => updates(message as Sort)) as Sort;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Sort create() => Sort._();
  @$core.override
  Sort createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Sort getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Sort>(create);
  static Sort? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get field_1 => $_getSZ(0);
  @$pb.TagNumber(1)
  set field_1($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasField_1() => $_has(0);
  @$pb.TagNumber(1)
  void clearField_1() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.bool get descending => $_getBF(1);
  @$pb.TagNumber(2)
  set descending($core.bool value) => $_setBool(1, value);
  @$pb.TagNumber(2)
  $core.bool hasDescending() => $_has(1);
  @$pb.TagNumber(2)
  void clearDescending() => $_clearField(2);

  @$pb.TagNumber(3)
  GeoDistance get geo => $_getN(2);
  @$pb.TagNumber(3)
  set geo(GeoDistance value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasGeo() => $_has(2);
  @$pb.TagNumber(3)
  void clearGeo() => $_clearField(3);
  @$pb.TagNumber(3)
  GeoDistance ensureGeo() => $_ensure(2);
}

class SearchRequest extends $pb.GeneratedMessage {
  factory SearchRequest({
    $core.String? entity,
    $0.Json? query,
    $core.Iterable<$core.String>? fields,
    $core.Iterable<Sort>? sort,
    $core.int? limit,
    $core.int? offset,
    $core.String? cacheKey,
  }) {
    final result = create();
    if (entity != null) result.entity = entity;
    if (query != null) result.query = query;
    if (fields != null) result.fields.addAll(fields);
    if (sort != null) result.sort.addAll(sort);
    if (limit != null) result.limit = limit;
    if (offset != null) result.offset = offset;
    if (cacheKey != null) result.cacheKey = cacheKey;
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
          _omitMessageNames ? '' : 'scribe.clients.searcher.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'entity')
    ..aOM<$0.Json>(2, _omitFieldNames ? '' : 'query',
        subBuilder: $0.Json.create)
    ..pPS(3, _omitFieldNames ? '' : 'fields')
    ..pPM<Sort>(4, _omitFieldNames ? '' : 'sort', subBuilder: Sort.create)
    ..aI(5, _omitFieldNames ? '' : 'limit', fieldType: $pb.PbFieldType.OU3)
    ..aI(6, _omitFieldNames ? '' : 'offset', fieldType: $pb.PbFieldType.OU3)
    ..aOS(7, _omitFieldNames ? '' : 'cacheKey')
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
  $core.String get entity => $_getSZ(0);
  @$pb.TagNumber(1)
  set entity($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasEntity() => $_has(0);
  @$pb.TagNumber(1)
  void clearEntity() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Json get query => $_getN(1);
  @$pb.TagNumber(2)
  set query($0.Json value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasQuery() => $_has(1);
  @$pb.TagNumber(2)
  void clearQuery() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Json ensureQuery() => $_ensure(1);

  @$pb.TagNumber(3)
  $pb.PbList<$core.String> get fields => $_getList(2);

  @$pb.TagNumber(4)
  $pb.PbList<Sort> get sort => $_getList(3);

  @$pb.TagNumber(5)
  $core.int get limit => $_getIZ(4);
  @$pb.TagNumber(5)
  set limit($core.int value) => $_setUnsignedInt32(4, value);
  @$pb.TagNumber(5)
  $core.bool hasLimit() => $_has(4);
  @$pb.TagNumber(5)
  void clearLimit() => $_clearField(5);

  @$pb.TagNumber(6)
  $core.int get offset => $_getIZ(5);
  @$pb.TagNumber(6)
  set offset($core.int value) => $_setUnsignedInt32(5, value);
  @$pb.TagNumber(6)
  $core.bool hasOffset() => $_has(5);
  @$pb.TagNumber(6)
  void clearOffset() => $_clearField(6);

  @$pb.TagNumber(7)
  $core.String get cacheKey => $_getSZ(6);
  @$pb.TagNumber(7)
  set cacheKey($core.String value) => $_setString(6, value);
  @$pb.TagNumber(7)
  $core.bool hasCacheKey() => $_has(6);
  @$pb.TagNumber(7)
  void clearCacheKey() => $_clearField(7);
}

class SearchHit extends $pb.GeneratedMessage {
  factory SearchHit({
    $core.String? id,
    $core.double? score,
    $0.Json? source,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (score != null) result.score = score;
    if (source != null) result.source = source;
    return result;
  }

  SearchHit._();

  factory SearchHit.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SearchHit.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SearchHit',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.searcher.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aD(2, _omitFieldNames ? '' : 'score')
    ..aOM<$0.Json>(3, _omitFieldNames ? '' : 'source',
        subBuilder: $0.Json.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SearchHit clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SearchHit copyWith(void Function(SearchHit) updates) =>
      super.copyWith((message) => updates(message as SearchHit)) as SearchHit;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SearchHit create() => SearchHit._();
  @$core.override
  SearchHit createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SearchHit getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<SearchHit>(create);
  static SearchHit? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.double get score => $_getN(1);
  @$pb.TagNumber(2)
  set score($core.double value) => $_setDouble(1, value);
  @$pb.TagNumber(2)
  $core.bool hasScore() => $_has(1);
  @$pb.TagNumber(2)
  void clearScore() => $_clearField(2);

  @$pb.TagNumber(3)
  $0.Json get source => $_getN(2);
  @$pb.TagNumber(3)
  set source($0.Json value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasSource() => $_has(2);
  @$pb.TagNumber(3)
  void clearSource() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Json ensureSource() => $_ensure(2);
}

class SearchResult extends $pb.GeneratedMessage {
  factory SearchResult({
    $core.Iterable<SearchHit>? hits,
    $fixnum.Int64? total,
    $0.Failure? error,
  }) {
    final result = create();
    if (hits != null) result.hits.addAll(hits);
    if (total != null) result.total = total;
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
          _omitMessageNames ? '' : 'scribe.clients.searcher.v1'),
      createEmptyInstance: create)
    ..pPM<SearchHit>(1, _omitFieldNames ? '' : 'hits',
        subBuilder: SearchHit.create)
    ..a<$fixnum.Int64>(2, _omitFieldNames ? '' : 'total', $pb.PbFieldType.OU6,
        defaultOrMaker: $fixnum.Int64.ZERO)
    ..aOM<$0.Failure>(3, _omitFieldNames ? '' : 'error',
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
  $pb.PbList<SearchHit> get hits => $_getList(0);

  @$pb.TagNumber(2)
  $fixnum.Int64 get total => $_getI64(1);
  @$pb.TagNumber(2)
  set total($fixnum.Int64 value) => $_setInt64(1, value);
  @$pb.TagNumber(2)
  $core.bool hasTotal() => $_has(1);
  @$pb.TagNumber(2)
  void clearTotal() => $_clearField(2);

  @$pb.TagNumber(3)
  $0.Failure get error => $_getN(2);
  @$pb.TagNumber(3)
  set error($0.Failure value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasError() => $_has(2);
  @$pb.TagNumber(3)
  void clearError() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Failure ensureError() => $_ensure(2);
}

class SearcherApi {
  final $pb.RpcClient _client;

  SearcherApi(this._client);

  $async.Future<AddResult> add($pb.ClientContext? ctx, AddRequest request) =>
      _client.invoke<AddResult>(ctx, 'Searcher', 'Add', request, AddResult());
  $async.Future<DeleteResult> delete(
          $pb.ClientContext? ctx, DeleteRequest request) =>
      _client.invoke<DeleteResult>(
          ctx, 'Searcher', 'Delete', request, DeleteResult());
  $async.Future<SearchResult> search(
          $pb.ClientContext? ctx, SearchRequest request) =>
      _client.invoke<SearchResult>(
          ctx, 'Searcher', 'Search', request, SearchResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
