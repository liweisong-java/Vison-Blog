package com.weisong.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.weisong.backend.entities.Article;
import com.weisong.backend.entities.User;
import org.apache.ibatis.annotations.*;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-26-11:40
 */
@Mapper
@Repository
public interface ArticleMapper {

//    查询所有文章
    List<Article> getAllArticle();

//    查询单个文章
    Article getArticleByUuid(@Param("article_uuid")String articleUuid);

//    增加指定uuid浏览量
    void incView(@Param("article_uuid")String articleUuid);

//    添加文章
    void addArticle(
            @Param("article_uuid") String articleUuid,
            @Param("title") String title,
            @Param("article") String article,
            @Param("read") Integer read,
            @Param("like") Integer like,
            @Param("answer")Integer answer,
            @Param("create_date") String createDate,
            @Param("update_date") String updateDate,
            @Param("user_uuid") String userUuid,
            @Param("name") String name,
            @Param("categoryId") String categoryId);

//    删除文章
    void deleteArticleById(@Param("article_uuid") String articleUuid);


}
